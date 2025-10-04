from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, HTTPException, Query

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
    try:
        await ensure_tle_cache()
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail="TLE cache unavailable") from exc

    now = datetime.now(timezone.utc)

    def parse_iso(value: str, field_name: str) -> datetime:
        sanitized = value.replace("Z", "+00:00")
        try:
            parsed = datetime.fromisoformat(sanitized)
        except ValueError as exc:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid {field_name}; expected ISO 8601 format (UTC).",
            ) from exc
        if parsed.tzinfo is None:
            parsed = parsed.replace(tzinfo=timezone.utc)
        else:
            parsed = parsed.astimezone(timezone.utc)
        return parsed

    t_from = parse_iso(time_from, "time_from") if time_from else now
    t_to = parse_iso(time_to, "time_to") if time_to else now + timedelta(hours=1)

    if t_to < t_from:
        raise HTTPException(status_code=400, detail="time_to must be greater than or equal to time_from")

    data = compute_details(norad_id, lat, lon, alt_m, t_from, t_to, stepSec)
    if not data:
        raise HTTPException(status_code=404, detail="NORAD id not found in current TLE cache")
    return data
