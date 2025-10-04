import astropy
import astropy.units as u
import numpy as np
from astropy.coordinates import SkyCoord
from astroquery.gaia import Gaia
from astropy.coordinates.builtin_frames.altaz import AltAz
from astropy.coordinates.earth import EarthLocation
from functools import lru_cache
from datetime import datetime
import json
from src.services.sky_visualization.coordinates import alt_az_to_enu


@lru_cache(maxsize=8)
def get_visible_stars(lat: float, lon: float, height: float=0, time: datetime=datetime.now()) -> astropy.table.Table:
    location = _location_from_lat_lon(lat, lon, height)
    time = astropy.time.Time(time)
    result = _get_stars_visible_from_location(location, time)
    stars = [_map_row_to_star(row) for row in result]
    return [star.to_visualizable_dict(location, time) for star in stars]


def _map_row_to_star(row: astropy.table.Row) -> "Star":
    return Star(
        source_id=int(row['source_id']),
        ra=float(row['ra']),
        dec=float(row['dec']),
        parallax=float(row['parallax']),
        magnitude=float(row['phot_g_mean_mag']),
        radius=float(row['radius_val']) if row['radius_val'] != np.nan else None,
    )


def _get_stars_visible_from_location(location: EarthLocation, time: astropy.time.Time) -> astropy.table.Table:
    zenith_altaz = SkyCoord(alt=90 * u.deg, az=0 * u.deg, frame=AltAz(obstime=time, location=location))
    zenith_icrs = zenith_altaz.transform_to('icrs')
    ra0 = zenith_icrs.ra.deg
    dec0 = zenith_icrs.dec.deg

    mag_limit = 8.0
    radius_deg = 90.0
    query = f"""
    SELECT TOP 1000 s.source_id, s.ra, s.dec, s.phot_g_mean_mag, s.radius_val, s.parallax
    FROM gaiadr2.gaia_source AS s
    WHERE s.phot_g_mean_mag < {mag_limit}
      AND CONTAINS(POINT('ICRS', s.ra, s.dec), CIRCLE('ICRS', {ra0}, {dec0}, {radius_deg})) = 1
      ORDER BY s.phot_g_mean_mag
    """

    job = Gaia.launch_job_async(query)
    gaia_data = job.get_results()

    return gaia_data


def _location_from_lat_lon(lat: float, lon: float, height_m: float=0.0) -> EarthLocation:
    return EarthLocation(lat=lat * u.deg, lon=lon * u.deg, height=height_m * u.m)


def parsec_to_solar_radius(parsec: float) -> float:
    return u.Quantity(parsec, u.pc).to(u.solRad).value


class Star:
    DISTANCE_FROM_EARTH = 400_000  # in kms, arbitrary distance so that they are always further than close objects like satellites

    def __init__(self, source_id: int, ra: float, dec: float, parallax: float, magnitude: float, radius: float | None):
        self.source_id = source_id
        self.ra = ra
        self.dec = dec
        self.magnitude = magnitude
        self.parallax = parallax  # in milliarcseconds
        self.radius = radius  # in solar radii

    def to_visualizable_dict(self, location: EarthLocation, time: astropy.time.Time) -> dict:
        enu_coords = self.to_ENU(location, time)
        return {
            "source_id": self.source_id,
            "magnitude": self.magnitude,
            "x": enu_coords[0],
            "y": enu_coords[1],
            "z": enu_coords[2],
            "earth_distance_ly": self.earth_dist_light_years,
        }
    
    def to_ENU(self, location: EarthLocation, time: astropy.time.Time) -> tuple[float, float, float]:
        star_coord = SkyCoord(ra=self.ra * u.deg, dec=self.dec * u.deg, frame='icrs')
        altaz = star_coord.transform_to(AltAz(obstime=time, location=location))
        return alt_az_to_enu(altaz.alt.deg, altaz.az.deg, Star.DISTANCE_FROM_EARTH)

    @property
    def earth_dist_pc(self) -> float:
        return 1000.0 / self.parallax

    @property
    def earth_dist_light_years(self) -> float:
        return u.Quantity(self.earth_dist_pc, u.pc).to(u.lyr).value


if __name__ == "__main__":
    # Example: Paris
    visible_stars = get_visible_stars(48.8566, 2.3522, height=35, time=datetime(2024, 6, 1, 22, 0, 0))
    print(json.dumps(visible_stars, indent=2, default=str))
