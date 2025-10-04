from pydantic import BaseModel
from typing import Optional, List, Literal
from .enums import SatelliteCategory
from .common import OrbitInfo

class MiniTrackPoint(BaseModel):
    t: str
    az: float
    el: float
    x: float
    y: float
    z: float
    subLon: float
    subLat: float

class SatelliteProps(BaseModel):
    norad_id: int
    category: Optional[SatelliteCategory] = None
    orbit: Optional[OrbitInfo] = None
    tle_age_hours: Optional[float] = None
    altitude_km: float
    speed_kms: float
    range_km: float
    range_rate_kms: float
    mini_track: Optional[List[MiniTrackPoint]] = None

class SkyObject(BaseModel):
    kind: Literal["satellite"] = "satellite"
    name: str
    az_deg: float
    el_deg: float
    x: float
    y: float
    z: float
    geometry: dict  # GeoJSON Point (sub-point)
    props: SatelliteProps
