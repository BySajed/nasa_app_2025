from fastapi import APIRouter, Query, HTTPException
from typing import Optional
from datetime import datetime, timezone, timedelta

from ..decorators.timing import timed
from ..services.artificial.tle_cache import ensure_tle_cache
from ..services.artificial.propagator_sgp4 import compute_details
from ..models.responses import DetailsResponse

router = APIRouter(prefix="/objects", tags=["objects"])

@router.get("/satellite/{norad_id}/details", response_model=DetailsResponse)
@timed("satellite_details")
async def satellite_details(
    norad_id: int,
    lat: float = Query(..., ge=-90, le=90),
    lon: float = Query(..., ge=-180, le=180),
    alt_m: float = Query(35, ge=-430, le=10000),
    time_from: Optional[str] = Query(None, description="ISO UTC, défaut: now"),
    time_to: Optional[str] = Query(None, description="ISO UTC, défaut: now+1h"),
    stepSec: int = Query(10, ge=1, le=120)
):
    await ensure_tle_cache()
    now = datetime.now(timezone.utc)
    t_from = datetime.fromisoformat(time_from.replace("Z","+00:00")) if time_from else now
    if time_to:
        t_to = datetime.fromisoformat(time_to.replace("Z","+00:00"))
    else:
        t_to = now + timedelta(hours=1)

    data = compute_details(norad_id, lat, lon, alt_m, t_from, t_to, stepSec)
    if not data:
        raise HTTPException(status_code=404, detail="NORAD id not found in current TLE cache")
    return data
