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


@lru_cache(maxsize=8)
def get_visible_stars(lat: float, lon: float, height: float=0, time: datetime=datetime.now()) -> astropy.table.Table:
    location = _location_from_lat_lon(lat, lon, height)
    time = astropy.time.Time(time)
    result = _get_stars_visible_from_location(location, time)
    return [_map_row_to_dict(row) for row in result]


def _map_row_to_dict(row: astropy.table.Row) -> dict:
    return  {
        "source_id": int(row['source_id']),
        "ra": float(row['ra']),
        "dec": float(row['dec']),
        "magnitude": float(row['phot_g_mean_mag']),
        "radius": float(row['radius_val']) if row['radius_val'] != np.nan else None,
    }


def _get_stars_visible_from_location(location: EarthLocation, time: astropy.time.Time) -> astropy.table.Table:
    zenith_altaz = SkyCoord(alt=90 * u.deg, az=0 * u.deg, frame=AltAz(obstime=time, location=location))
    zenith_icrs = zenith_altaz.transform_to('icrs')
    ra0 = zenith_icrs.ra.deg
    dec0 = zenith_icrs.dec.deg

    mag_limit = 8.0
    radius_deg = 90.0
    query = f"""
    SELECT TOP 1000 s.source_id, s.ra, s.dec, s.phot_g_mean_mag, s.radius_val
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


if __name__ == "__main__":
    # Example: Paris
    visible_stars = get_visible_stars(48.8566, 2.3522, height=35, time=datetime(2024, 6, 1, 22, 0, 0))
    print(json.dumps(visible_stars, indent=2,))

