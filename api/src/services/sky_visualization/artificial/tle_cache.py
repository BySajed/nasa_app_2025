import asyncio
import logging
import time
from typing import Dict, Tuple
from src.dependencies.settings import settings
from .catalogs_celestrak import fetch_celestrak_all

logger = logging.getLogger("api")

_TLE_MEM: Dict[int, Tuple[str, str, str]] = {}
_TLE_FETCH_TS: float | None = None
_TLE_LOCK = asyncio.Lock()

async def ensure_tle_cache():
    """Ensure the in-memory TLE cache is fresh.
    """
    global _TLE_MEM, _TLE_FETCH_TS

    # Fast-path: if data is recent enough, return immediately (no lock).
    if _TLE_FETCH_TS and (time.time() - _TLE_FETCH_TS) < settings.TLE_REFRESH_HOURS * 3600 and _TLE_MEM:
        return

    # Only one refresh attempt at a time.
    async with _TLE_LOCK:
        # Re-check freshness after acquiring lock (another task may have refreshed).
        if _TLE_FETCH_TS and (time.time() - _TLE_FETCH_TS) < settings.TLE_REFRESH_HOURS * 3600 and _TLE_MEM:
            return

        attempts = max(1, settings.TLE_FETCH_RETRIES)
        backoff = max(0, settings.TLE_FETCH_BACKOFF_SECONDS)
        last_exc: Exception | None = None

        for attempt in range(1, attempts + 1):
            try:
                data = await fetch_celestrak_all()
                _TLE_MEM = data
                _TLE_FETCH_TS = time.time()
                logger.info("TLE cache refreshed: %s objects", len(_TLE_MEM))
                return
            except asyncio.CancelledError:
                raise
            except Exception as exc:
                last_exc = exc
                logger.warning(
                    "TLE refresh attempt %s/%s failed: %s", attempt, attempts, exc,
                    exc_info=False,
                )
                if attempt < attempts and backoff > 0:
                    await asyncio.sleep(backoff * attempt)

        # All attempts failed.
        if last_exc:
            if _TLE_MEM:
                logger.error(
                    "TLE refresh failed; continuing with cached data (%s items). Last error: %s",
                    len(_TLE_MEM),
                    last_exc,
                    exc_info=False,
                )
                return
            raise RuntimeError("Unable to refresh TLE cache") from last_exc

def get_tle_map() -> dict[int, tuple[str, str, str]]:
    """Return the in-memory TLE mapping."""
    return _TLE_MEM
