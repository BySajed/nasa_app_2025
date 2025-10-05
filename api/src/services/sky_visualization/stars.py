import astropy
import astropy.units as u
import numpy as np
from astropy.coordinates import SkyCoord
from astroquery.gaia import Gaia
from astropy.coordinates.builtin_frames.altaz import AltAz
from astropy.coordinates.earth import EarthLocation
from datetime import datetime
from math import isnan  
import json
from src.services.sky_visualization.coordinates import alt_az_to_enu
from typing import  Optional
from cachetools import cached, TTLCache


@cached(cache=TTLCache(maxsize=8, ttl=300))
def get_visible_stars(lat: float, lon: float, height: float=0, time: Optional[datetime]=None) -> astropy.table.Table:
    location = _location_from_lat_lon(lat, lon, height)
    time = astropy.time.Time(time or datetime.utcnow())
    result = _get_stars_visible_from_location(location, time)
    stars = [_map_row_to_star(row) for row in result]
    return [star.to_visualizable_dict(location, time) for star in stars]


def _map_row_to_star(row: astropy.table.Row) -> "Star":
    return Star(
        source_id=int(row["source_id"]),
        ra=float(row["ra"]),
        dec=float(row["dec"]),
        parallax=float(row["parallax"]) if row["parallax"] != np.nan else None,
        magnitude=float(row["phot_g_mean_mag"]),
        radius=float(row["radius_val"]) if row["radius_val"] != np.nan else None,
        temp_kelvin=float(row["teff_val"]) if row["teff_val"] != np.nan else None,
    )


def _get_stars_visible_from_location(
    location: EarthLocation, time: astropy.time.Time
) -> astropy.table.Table:
    zenith_altaz = SkyCoord(
        alt=90 * u.deg, az=0 * u.deg, frame=AltAz(obstime=time, location=location)
    )
    zenith_icrs = zenith_altaz.transform_to("icrs")
    ra0 = zenith_icrs.ra.deg
    dec0 = zenith_icrs.dec.deg

    mag_limit = 8.0
    radius_deg = 90.0
    query = f"""
    SELECT TOP 1000 s.source_id, s.ra, s.dec, s.phot_g_mean_mag, s.radius_val, s.parallax, s.teff_val
    FROM gaiadr2.gaia_source AS s
    WHERE s.phot_g_mean_mag < {mag_limit}
      AND CONTAINS(POINT('ICRS', s.ra, s.dec), CIRCLE('ICRS', {ra0}, {dec0}, {radius_deg})) = 1
      ORDER BY s.phot_g_mean_mag
    """

    job = Gaia.launch_job_async(query)
    gaia_data = job.get_results()

    return gaia_data


def _location_from_lat_lon(
    lat: float, lon: float, height_m: float=0.0
) -> EarthLocation:
    return EarthLocation(lat=lat * u.deg, lon=lon * u.deg, height=height_m * u.m)


def parsec_to_solar_radius(parsec: float) -> float:
    return u.Quantity(parsec, u.pc).to(u.solRad).value


class Star:
    DISTANCE_FROM_EARTH = 400_000  # in kms, arbitrary distance so that they are always further than close objects like satellites

    def __init__(
        self,
        source_id: int,
        ra: float,
        dec: float,
        parallax: float | None,
        magnitude: float,
        radius: float | None,
        temp_kelvin: float | None ,
    ):
        self.source_id = source_id
        self.coords = SkyCoord(ra=ra * u.deg, dec=dec * u.deg, frame="icrs")
        self.magnitude = magnitude
        self.parallax = parallax  # in milliarcseconds
        self.radius = radius  # in solar radii
        self.temp_kelvin = temp_kelvin  # in Kelvin

    def to_visualizable_dict(
        self, location: EarthLocation, time: astropy.time.Time
    ) -> dict:
        enu_coords = self.to_ENU(location, time)

        return {
            "source_id": self.source_id,
            "magnitude": self.magnitude,
            "x": enu_coords[0],
            "y": enu_coords[1],
            "z": enu_coords[2],
            "earth_distance_ly": self.earth_dist_light_years,
            "color": self.kelvin_to_hex(self.temp_kelvin) if self.temp_kelvin else "#ffffff",
            "constellation": self.constellation,
        }

    def to_ENU(
        self, location: EarthLocation, time: astropy.time.Time
    ) -> tuple[float, float, float]:
        altaz = self.coords.transform_to(AltAz(obstime=time, location=location))
        return alt_az_to_enu(altaz.alt.deg, altaz.az.deg, Star.DISTANCE_FROM_EARTH)

    @property
    def earth_dist_pc(self) -> float | None:
        return 1000.0 / self.parallax if self.parallax and self.parallax != 0 else None

    @property
    def earth_dist_light_years(self) -> float | None:
        return (
            u.Quantity(self.earth_dist_pc, u.pc).to(u.lyr).value
            if self.earth_dist_pc
            else None
        )

    @property
    def constellation(self) -> Optional[str]:
        try:
            return self.coords.get_constellation()
        except Exception:
            return None

    @staticmethod
    def kelvin_to_rgb(temp_kelvin):
        if isnan(temp_kelvin):
            return 255, 255, 255

        # Ensure the temperature is within the typical range for visible spectrum
        temp_kelvin = max(1000, min(temp_kelvin, 40000)) / 100

        # Calculate red
        if temp_kelvin <= 66:
            red = 255
        else:
            red = 329.698727446 * ((temp_kelvin - 60) ** -0.1332047592)
            red = max(0, min(255, red))

        # Calculate green
        if temp_kelvin <= 66:
            green = 99.4708025861 * np.log(temp_kelvin) - 161.1195681661
            green = max(0, min(255, green))
        else:
            green = 288.1221695283 * ((temp_kelvin - 60) ** -0.0755148492)
            green = max(0, min(255, green))

        # Calculate blue
        if temp_kelvin >= 66:
            blue = 255
        else:
            if temp_kelvin <= 19:
                blue = 0
            else:
                blue = 138.5177312231 * np.log(temp_kelvin - 10) - 305.0447927307
                blue = max(0, min(255, blue))

        return int(red), int(green), int(blue)

    @staticmethod
    def kelvin_to_hex(temp_kelvin):
        rgb = Star.kelvin_to_rgb(temp_kelvin)
        return Star.rgb_to_hex(rgb)

    @staticmethod
    def rgb_to_hex(rgb):
        return "#{:02x}{:02x}{:02x}".format(rgb[0], rgb[1], rgb[2])


if __name__ == "__main__":
    # Example: Paris
    visible_stars = get_visible_stars(
        48.8566, 2.3522, height=35, time=datetime(2024, 6, 1, 22, 0, 0)
    )
    print(json.dumps(visible_stars, indent=2, default=str))
