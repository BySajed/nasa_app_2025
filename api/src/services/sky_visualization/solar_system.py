import astropy
import astropy.units as u
import numpy as np
from astropy.coordinates import SkyCoord, get_body, solar_system_ephemeris
from astropy.coordinates.builtin_frames.altaz import AltAz
from astropy.coordinates import EarthLocation
from functools import lru_cache
from datetime import datetime
from src.services.sky_visualization.coordinates import alt_az_to_enu
from typing import Any, Dict, List

MAG = {
    "moon": -12.6,
    "mercury": 0.23,
    "venus": -4.4,
    "mars": -1.52,
    "jupiter": -9.4,
    "saturn": -8.88,
    "uranus": -7.19,
    "neptune": -6.87,
    "pluto": -1.0,
}


@lru_cache(maxsize=8)
def get_solar_system_positions(
    lat: float, lon: float, height: float = 0, time: datetime = None
) -> List[Dict[str, Any]]:
    if time is None:
        time = datetime.now()

    location = _location_from_lat_lon(lat, lon, height)
    time_astropy = astropy.time.Time(time)

    planets = []

    celestial_bodies = [
        "moon",
        "mercury",
        "venus",
        "mars",
        "jupiter",
        "saturn",
        "uranus",
        "neptune",
        "pluto",
    ]

    with solar_system_ephemeris.set("de432s"):
        for body_name in celestial_bodies:
            try:
                planet = _get_planet_position(body_name, location, time_astropy)
                if planet:
                    planets.append(planet)
            except Exception as e:
                print(f"Error calculating the position of {body_name}: {e}")
                continue

    return planets


def _get_planet_position(
    body_name: str, location: EarthLocation, time: astropy.time.Time
) -> Dict[str, Any] | None:
    try:
        body_coord = get_body(body_name, time, location)

        altaz = body_coord.transform_to(AltAz(obstime=time, location=location))

        if altaz.alt.deg < 0:
            return None

        distance_km = body_coord.distance.to(u.km).value

        magnitude = _calculate_planet_magnitude(body_name, body_coord, time)

        scaled_distance_km = distance_km / 100000
        enu_coords = alt_az_to_enu(altaz.alt.deg, altaz.az.deg, scaled_distance_km)

        return {
            "name": body_name.capitalize(),
            "altitude": float(altaz.alt.deg),
            "azimuth": float(altaz.az.deg),
            "x": float(enu_coords[0]),
            "y": float(enu_coords[1]),
            "z": float(enu_coords[2]),
            "distance_km": float(distance_km),
            "scaled_distance_km": float(scaled_distance_km),
            "magnitude": float(magnitude),
            "is_visible": bool(altaz.alt.deg > 0),
        }

    except Exception as e:
        print(f"Error calculating the position of {body_name}: {e}")
        return None


def _calculate_planet_magnitude(
    body_name: str, body_coord: SkyCoord, time: astropy.time.Time
) -> float:
    try:
        distance_au = body_coord.distance.to(u.AU).value

        if body_name == "moon":
            return _calculate_moon_magnitude(body_coord, time)
        else:
            return _calculate_magnitude(body_name, distance_au)

    except Exception as e:
        print(f"Error calculating the magnitude of {body_name}: {e}")
        return 0.0


def _calculate_moon_magnitude(body_coord: SkyCoord, time: astropy.time.Time) -> float:
    full_moon_mag = -12.6

    distance_km = body_coord.distance.to(u.km).value
    avg_distance = 384400

    mag_variation = 2.5 * np.log10((distance_km / avg_distance) ** 2)

    return full_moon_mag + mag_variation


def _calculate_magnitude(body_name: str, distance_au: float) -> float:
    abs_mag = MAG.get(body_name, 0.0)
    apparent_mag = abs_mag + 5 * np.log10(distance_au)
    return apparent_mag


def _location_from_lat_lon(
    lat: float, lon: float, height_m: float = 0.0
) -> EarthLocation:
    return EarthLocation(lat=lat * u.deg, lon=lon * u.deg, height=height_m * u.m)
