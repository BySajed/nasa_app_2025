from fastapi import APIRouter, Query
from ..dependencies.settings import settings
from ..decorators.timing import timed
from ..services.artificial.tle_cache import ensure_tle_cache
from ..services.artificial.propagator_sgp4 import compute_above
from ..models.responses import AboveResponse

router = APIRouter(prefix="/sky", tags=["sky"])

@router.get("/above", response_model=AboveResponse)
@timed("sky_above")
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
    await ensure_tle_cache()
    data = compute_above(
        lat, lon, alt_m,
        limit, offset,
        track_mode=trackMode,
        track_step_s=trackStepSec
    )
    return data
