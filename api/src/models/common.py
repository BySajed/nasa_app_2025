from pydantic import BaseModel
from typing import Optional

class Observer(BaseModel):
    lat: float
    lon: float
    alt_m: float
    time_utc: str

class OrbitInfo(BaseModel):
    period_min: Optional[float] = None
    inclination_deg: Optional[float] = None
    type: Optional[str] = None  # LEO/MEO/GEO…

class TimeRange(BaseModel):
    start_utc: str
    end_utc: str
    step_sec: int
