from typing import Dict, Tuple, List, Optional
from datetime import datetime, timedelta, timezone

import numpy as np
from skyfield.api import Loader, wgs84, EarthSatellite
from astropy.time import Time
from astropy.coordinates import SkyCoord, AltAz, EarthLocation
import astropy.units as u
from skyfield.framelib import itrs
from ..coordinates import alt_az_to_enu

from .tle_cache import get_tle_map
from .classify import infer_category
from ...time_utils import iso_z
from ...visibility import above_horizon

_loader = Loader('.skyfield')
ts = _loader.timescale()

def _earth_location(lat: float, lon: float, alt_m: float) -> EarthLocation:
    return EarthLocation(lat=lat*u.deg, lon=lon*u.deg, height=alt_m*u.m)

def _to_altaz(x_km, y_km, z_km, observer: EarthLocation, t_utc: datetime):
    obstime = Time(t_utc, scale='utc')
    sc = SkyCoord(x=x_km*u.km, y=y_km*u.km, z=z_km*u.km, frame='itrs', obstime=obstime)
    altaz = sc.transform_to(AltAz(obstime=obstime, location=observer))
    return float(altaz.az.deg), float(altaz.alt.deg)

def _satellite_from_tle(name: str, l1: str, l2: str) -> EarthSatellite:
    return EarthSatellite(l1, l2, name, ts)

def _tle_age_hours(l1: str) -> Optional[float]:
    try:
        epoch_year = int("20" + l1[18:20])
        epoch_day = float(l1[20:32])
        epoch = datetime(epoch_year, 1, 1, tzinfo=timezone.utc) + timedelta(days=epoch_day-1)
        return (datetime.now(timezone.utc) - epoch).total_seconds() / 3600.0
    except Exception:
        return None

def _mini_track_points(sat: EarthSatellite, observer: EarthLocation, start: datetime, step_s: int, count: int):
    """
    Generate 0/1/3 points:
      count=0 -> []
      count=1 -> [t0+step]
      count=3 -> [t0, t0+step, t0+2*step]
    """
    pts: List[dict] = []
    idxs = []
    if count == 1:
        idxs = [1]
    elif count == 3:
        idxs = [0, 1, 2]
    else:
        return pts

    # Extract observer lat/lon/alt for topocentric range computation
    obs_lat = observer.lat.to(u.deg).value
    obs_lon = observer.lon.to(u.deg).value
    obs_alt_m = observer.height.to(u.m).value

    for i in idxs:
        dt = start + timedelta(seconds=i*step_s)
        tt = ts.from_datetime(dt)
        geo = sat.at(tt)
        sp = wgs84.subpoint(geo)
        itrf = geo.frame_xyz(itrs).km
        az, el = _to_altaz(itrf[0], itrf[1], itrf[2], observer, dt)

        # Topocentric vector to get range (distance observer->sat)
        difference = sat - wgs84.latlon(obs_lat, obs_lon, elevation_m=obs_alt_m)
        topo = difference.at(tt)
        pos_km = topo.position.km
        range_km = float(np.linalg.norm(pos_km))

        x, y, z = alt_az_to_enu(el, az, range_km)

        pts.append({
            "t": iso_z(dt),
            "az": az, "el": el,
            "x": x, "y": y, "z": z,
            "subLon": float(sp.longitude.degrees),
            "subLat": float(sp.latitude.degrees)
        })
    return pts

def compute_above(
    lat: float, lon: float, alt_m: float,
    limit: int, offset: int,
    track_mode: str = "none",   # "none" | "point" | "triad"
    track_step_s: int = 30
):
    tle_map = get_tle_map()
    observer = _earth_location(lat, lon, alt_m)
    now = datetime.now(timezone.utc)
    t = ts.from_datetime(now)

    objects = []
    total_estimated = 0

    # Détermine nb de points du mini-track
    if track_mode == "none":
        mini_count = 0
    elif track_mode == "point":
        mini_count = 1
    elif track_mode == "triad":
        mini_count = 3
    else:
        mini_count = 0  # fallback

    for norad_id, (name, l1, l2) in tle_map.items():
        sat = _satellite_from_tle(name, l1, l2)
        geocentric = sat.at(t)
        sp = wgs84.subpoint(geocentric)

        # Observateur topocentrique
        difference = sat - wgs84.latlon(lat, lon, elevation_m=alt_m)
        topo = difference.at(t)
        pos_km = topo.position.km
        vel_kms = topo.velocity.km_per_s
        range_km = np.linalg.norm(pos_km)
        range_rate = float(np.dot(vel_kms, pos_km / (range_km + 1e-12)))

        # ITRF pour AltAz
        # Changed to pass frame argument (itrs) to frame_xyz per new Skyfield API
        itrf = geocentric.frame_xyz(itrs).km
        az, el = _to_altaz(itrf[0], itrf[1], itrf[2], observer, now)
        if not above_horizon(el):
            continue

        total_estimated += 1
        if total_estimated <= offset or len(objects) >= limit:
            continue

        altitude_km = float(sp.elevation.km)
        speed_kms = float(np.linalg.norm(vel_kms))

        x, y, z = alt_az_to_enu(el, az, float(range_km))

        mini_track = _mini_track_points(sat, observer, now, track_step_s, mini_count)

        objects.append({
            "kind": "satellite",
            "name": name,
            "az_deg": az,
            "el_deg": el,
            "x": x,
            "y": y,
            "z": z,
            "geometry": {
                "type":"Point",
                "coordinates":[float(sp.longitude.degrees), float(sp.latitude.degrees)]
            },
            "props": {
                "norad_id": norad_id,
                "category": infer_category(name),
                "orbit": None,
                "tle_age_hours": _tle_age_hours(l1),
                "altitude_km": altitude_km,
                "speed_kms": speed_kms,
                "range_km": float(range_km),
                "range_rate_kms": float(range_rate),
                "mini_track": mini_track if mini_track else None
            }
        })

    return {
        "observer": {
            "lat": lat, "lon": lon, "alt_m": alt_m,
            "time_utc": iso_z(now)
        },
        "paging": {"limit": limit, "offset": offset, "total_estimated": total_estimated},
        "objects": objects
    }

# compute_details reste inchangé (il garde le track détaillé)
def compute_details(
    norad_id: int, lat: float, lon: float, alt_m: float,
    t_from: datetime, t_to: datetime, step_s: int
):
    tle_map = get_tle_map()
    if norad_id not in tle_map:
        return None
    name, l1, l2 = tle_map[norad_id]
    sat = _satellite_from_tle(name, l1, l2)

    observer = _earth_location(lat, lon, alt_m)
    timeline = []
    ground_coords = []

    cur = t_from
    while cur <= t_to:
        tt = ts.from_datetime(cur)
        geo = sat.at(tt)
        sp = wgs84.subpoint(geo)
        # Changed to pass frame argument (itrs) to frame_xyz per new Skyfield API
        itrf = geo.frame_xyz(itrs).km
        az, el = _to_altaz(itrf[0], itrf[1], itrf[2], observer, cur)

        diff = sat - wgs84.latlon(lat, lon, elevation_m=alt_m)
        top = diff.at(tt)
        rng = float(top.distance().km)

        timeline.append({
            "t": iso_z(cur),
            "az": az, "el": el,
            "range_km": rng,
            "subLon": float(sp.longitude.degrees),
            "subLat": float(sp.latitude.degrees)
        })
        ground_coords.append([float(sp.longitude.degrees), float(sp.latitude.degrees)])
        cur += timedelta(seconds=step_s)

    orbit = {"period_min": None, "inclination_deg": None, "type": None}
    return {
        "object_id": f"SAT:{norad_id}",
        "kind": "satellite",
        "name": name,
        "info": {
            "orbit": orbit,
            "tle_age_hours": _tle_age_hours(l1),
            "timeline": timeline,
            "groundtrack": {"type":"LineString","coordinates": ground_coords}
        }
    }
