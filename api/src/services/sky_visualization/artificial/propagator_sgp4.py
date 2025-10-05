from typing import List, Optional
from datetime import datetime, timedelta, timezone

import numpy as np
from skyfield.api import Loader, wgs84, EarthSatellite
from src.services.sky_visualization.coordinates import alt_az_to_enu

from .tle_cache import get_tle_map
from .classify import infer_category
from src.services.time_utils import iso_z
from src.services.visibility import above_horizon

_loader = Loader('.skyfield')
ts = _loader.timescale()

_sat_cache: dict[int, EarthSatellite] = {}
_sat_meta: dict[int, dict] = {}


def _tle_epoch_datetime(l1: str) -> Optional[datetime]:
    """Parse epoch datetime (UTC) from TLE line 1 for later age computation."""
    try:
        epoch_year = int("20" + l1[18:20])
        epoch_day = float(l1[20:32])
        return datetime(epoch_year, 1, 1, tzinfo=timezone.utc) + timedelta(days=epoch_day - 1)
    except Exception:
        return None


def _orbit_from_tle(l2: str) -> dict:
    """Extract minimal orbit info (period, inclination, type) from TLE line 2."""
    try:
        inc_deg = float(l2[8:16])
    except Exception:
        inc_deg = None
    try:
        mean_motion = float(l2[52:63])  # revs per day
    except Exception:
        mean_motion = None
    period_min = 1440.0 / mean_motion if mean_motion and mean_motion > 0 else None

    orb_type = None
    if period_min:
        if period_min < 128:
            orb_type = "LEO"
        elif period_min < 800:
            orb_type = "MEO"
        elif period_min < 1500:
            orb_type = "GEO"
        else:
            orb_type = "HIGH"

    return {"period_min": period_min, "inclination_deg": inc_deg, "type": orb_type}


def _satellite_from_tle(name: str, l1: str, l2: str) -> EarthSatellite:
    return EarthSatellite(l1, l2, name, ts)


def _ensure_sat_cache(tle_map: dict[int, tuple[str, str, str]]):
    """Rebuild cache if empty or if size/any line changed (simple invalidation)."""
    global _sat_cache, _sat_meta

    if not _sat_cache or len(_sat_cache) != len(tle_map):
        rebuild = True
    else:
        rebuild = False
        for norad_id, (name, l1, l2) in tle_map.items():
            meta = _sat_meta.get(norad_id)
            if not meta or meta["l1"] != l1 or meta["l2"] != l2:
                rebuild = True
                break

    if not rebuild:
        return

    new_sat_cache: dict[int, EarthSatellite] = {}
    new_meta: dict[int, dict] = {}
    for norad_id, (name, l1, l2) in tle_map.items():
        sat = _satellite_from_tle(name, l1, l2)
        epoch_dt = _tle_epoch_datetime(l1)
        orbit = _orbit_from_tle(l2)
        category = infer_category(name)
        new_sat_cache[norad_id] = sat
        new_meta[norad_id] = {
            "name": name,
            "l1": l1,
            "l2": l2,
            "epoch_dt": epoch_dt,
            "orbit": orbit,
            "category": category,
        }
    _sat_cache = new_sat_cache
    _sat_meta = new_meta


def _tle_age_hours_from_epoch(now: datetime, epoch_dt: Optional[datetime]) -> Optional[float]:
    if not epoch_dt:
        return None
    return (now - epoch_dt).total_seconds() / 3600.0


def _mini_track_points(
    sat: EarthSatellite,
    obs_lat: float,
    obs_lon: float,
    obs_alt_m: float,
    start: datetime,
    step_s: int,
    count: int,
):
    """Generate 0/1/3 future track points using Skyfield only (avoid Astropy)."""
    pts: List[dict] = []
    if count not in (1, 3):
        return pts
    idxs = [1] if count == 1 else [0, 1, 2]

    observer_topo = wgs84.latlon(obs_lat, obs_lon, elevation_m=obs_alt_m)

    for i in idxs:
        dt = start + timedelta(seconds=i * step_s)
        tt = ts.from_datetime(dt)
        geo = sat.at(tt)
        sp = wgs84.subpoint(geo)
        difference = sat - observer_topo
        topo = difference.at(tt)
        alt, az, dist = topo.altaz()
        el_deg = float(alt.degrees)
        az_deg = float(az.degrees)
        range_km = float(dist.km)
        x, y, z = alt_az_to_enu(el_deg, az_deg, range_km)

        pts.append(
            {
                "t": iso_z(dt),
                "az": az_deg,
                "el": el_deg,
                "x": x,
                "y": y,
                "z": z,
                "subLon": float(sp.longitude.degrees),
                "subLat": float(sp.latitude.degrees),
            }
        )
    return pts

def compute_above(
    lat: float,
    lon: float,
    alt_m: float,
    limit: int,
    offset: int,
    track_mode: str = "none",  # "none" | "point" | "triad"
    track_step_s: int = 30,
    categories_filter: Optional[list[str]] = None,
    fast_mode: bool = False,
):
    tle_map = get_tle_map()
    _ensure_sat_cache(tle_map)

    now = datetime.now(timezone.utc)
    t = ts.from_datetime(now)

    objects = []
    total_estimated = 0

    if track_mode == "none":
        mini_count = 0
    elif track_mode == "point":
        mini_count = 1
    elif track_mode == "triad":
        mini_count = 3
    else:
        mini_count = 0

    categories_set = set(c.lower() for c in categories_filter) if categories_filter else None

    observer_topo = wgs84.latlon(lat, lon, elevation_m=alt_m)

    for norad_id, sat in _sat_cache.items():
        meta = _sat_meta[norad_id]

        if categories_set:
            cat = meta.get("category")
            if not cat or cat.lower() not in categories_set:
                continue

        difference = sat - observer_topo
        topo = difference.at(t)
        pos_km = topo.position.km
        vel_kms = topo.velocity.km_per_s
        alt_angle, az_angle, dist = topo.altaz()
        el_deg = float(alt_angle.degrees)
        if not above_horizon(el_deg):
            continue
        az_deg = float(az_angle.degrees)
        range_km = float(dist.km)

        geo = sat.at(t)
        sp = wgs84.subpoint(geo)

        total_estimated += 1
        if total_estimated <= offset:
            continue
        if len(objects) >= limit:
            if fast_mode:
                break
            else:
                continue

        range_rate = float(np.dot(vel_kms, pos_km / (range_km + 1e-12)))
        altitude_km = float(sp.elevation.km)
        speed_kms = float(np.linalg.norm(vel_kms))
        x, y, z = alt_az_to_enu(el_deg, az_deg, range_km)
        mini_track = _mini_track_points(sat, lat, lon, alt_m, now, track_step_s, mini_count)

        tle_age_hours = _tle_age_hours_from_epoch(now, meta["epoch_dt"]) if meta.get("epoch_dt") else None

        objects.append(
            {
                "kind": "satellite",
                "name": meta["name"],
                "az_deg": az_deg,
                "el_deg": el_deg,
                "x": x,
                "y": y,
                "z": z,
                "geometry": {
                    "type": "Point",
                    "coordinates": [float(sp.longitude.degrees), float(sp.latitude.degrees)],
                },
                "props": {
                    "norad_id": norad_id,
                    "category": meta.get("category"),
                    "orbit": meta.get("orbit"),
                    "tle_age_hours": tle_age_hours,
                    "altitude_km": altitude_km,
                    "speed_kms": speed_kms,
                    "range_km": range_km,
                    "range_rate_kms": float(range_rate),
                    "mini_track": mini_track if mini_track else None,
                },
            }
        )

    # Fast mode: return total as offset + count to avoid full count scan
    if fast_mode:
        total_field = max(total_estimated, offset + len(objects))
    else:
        total_field = total_estimated

    return {
        "observer": {"lat": lat, "lon": lon, "alt_m": alt_m, "time_utc": iso_z(now)},
        "paging": {"limit": limit, "offset": offset, "total_estimated": total_field},
        "objects": objects,
    }


def compute_details(
    norad_id: int,
    lat: float,
    lon: float,
    alt_m: float,
    t_from: datetime,
    t_to: datetime,
    step_s: int,
):
    tle_map = get_tle_map()
    _ensure_sat_cache(tle_map)

    if norad_id not in _sat_cache:
        return None

    sat = _sat_cache[norad_id]
    meta = _sat_meta[norad_id]

    observer_topo = wgs84.latlon(lat, lon, elevation_m=alt_m)

    timeline = []
    ground_coords = []

    cur = t_from
    while cur <= t_to:
        tt = ts.from_datetime(cur)
        geo = sat.at(tt)
        sp = wgs84.subpoint(geo)
        difference = sat - observer_topo
        topo = difference.at(tt)
        alt_angle, az_angle, dist = topo.altaz()
        el_deg = float(alt_angle.degrees)
        az_deg = float(az_angle.degrees)
        rng = float(dist.km)

        timeline.append(
            {
                "t": iso_z(cur),
                "az": az_deg,
                "el": el_deg,
                "range_km": rng,
                "subLon": float(sp.longitude.degrees),
                "subLat": float(sp.latitude.degrees),
            }
        )
        ground_coords.append([float(sp.longitude.degrees), float(sp.latitude.degrees)])
        cur += timedelta(seconds=step_s)

    return {
        "object_id": f"SAT:{norad_id}",
        "kind": "satellite",
        "name": meta["name"],
        "info": {
            "orbit": meta.get("orbit"),
            "tle_age_hours": _tle_age_hours_from_epoch(datetime.now(timezone.utc), meta.get("epoch_dt")),
            "timeline": timeline,
            "groundtrack": {"type": "LineString", "coordinates": ground_coords},
        },
    }


def warm_sat_cache():
    """Build/refresh satellite objects + static metadata cache (no propagation).
    Call at service startup to avoid first-request latency.
    """
    tle_map = get_tle_map()
    _ensure_sat_cache(tle_map)
