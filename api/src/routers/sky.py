from datetime import datetime
from typing import Optional

from fastapi import APIRouter, HTTPException, Query
from src.dependencies.settings import settings
from src.decorators.timing import timed
from src.services.sky_visualization.artificial.tle_cache import ensure_tle_cache
from src.services.sky_visualization.artificial.propagator_sgp4 import compute_above
from src.models.responses import AboveResponse
from src.services.sky_visualization.solar_system import get_solar_system_positions
from src.services.sky_visualization.stars import get_visible_stars
from datetime import datetime, timezone
from typing import Optional

router = APIRouter(prefix="/sky", tags=["sky"])

@router.get("/satellite", response_model=AboveResponse)
@timed("sky_satellite")
async def sky_above(
    lat: float = Query(..., ge=-90, le=90),
    lon: float = Query(..., ge=-180, le=180),
    alt_m: float = Query(default=settings.DEFAULT_OBSERVER_ALT_M, ge=-430, le=10000),
    limit: int = Query(default=settings.DEFAULT_LIMIT, ge=1, le=settings.MAX_LIMIT),
    offset: int = Query(default=0, ge=0),
    trackMode: str = Query(default="none", pattern="^(none|point|triad)$"),
    trackStepSec: int = Query(default=settings.DEFAULT_TRACK_STEP_SEC, ge=5, le=120)
):
    """
    trackMode:
      - none  : pas de track (par défaut, plus performant)
      - point : 1 point futur (t0 + trackStepSec)
      - triad : 3 points (t0, t0+trackStepSec, t0+2*trackStepSec)
    """
    try:
        await ensure_tle_cache()
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail="TLE cache unavailable") from exc
    data = compute_above(
        lat, lon, alt_m,
        limit, offset,
        track_mode=trackMode,
        track_step_s=trackStepSec
    )
    return data

@router.get("/stars")
def get_stars(lat: float, lon: float, height: float = 0, time: Optional[str] = None):

    if time:
        time = datetime.fromisoformat(time)
    else:
        time = None

    stars = get_visible_stars(lat, lon, height, time)
    return {"stars": stars}


@router.get("/solar-system")
def get_solar_system(lat: float, lon: float):
    time = datetime.now()
    planets = get_solar_system_positions(lat, lon, 0, time)
    return {"planets": planets}
