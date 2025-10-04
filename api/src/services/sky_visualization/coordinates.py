import numpy as np


def alt_az_to_enu(alt: float, az: float, distance: float) -> tuple[float, float, float]:
    """
    Convert altitude and azimuth to East-North-Up (ENU) coordinates.
    Those coordinates are usable by the frontend for 3D visualization.
    alt and az are in degrees. Distance is in km.
    """

    alt_rad = np.radians(alt)
    az_rad = np.radians(az)

    x = distance * np.cos(alt_rad) * np.sin(az_rad)  # East
    y = distance * np.cos(alt_rad) * np.cos(az_rad)  # North
    z = distance * np.sin(alt_rad)  # Up

    return (x, y, z)
