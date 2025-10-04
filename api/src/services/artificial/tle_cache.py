import json, time
from typing import Dict, Tuple
from ...dependencies.redis_client import get_redis
from ...dependencies.settings import settings
from .catalogs_celestrak import fetch_celestrak_all

_TLE_MEM: Dict[int, Tuple[str,str,str]] = {}
_TLE_FETCH_TS: float | None = None

KEY_TLE = "tle:map"

async def ensure_tle_cache():
    """Reload cache if to old (default 6hours)"""
    global _TLE_MEM, _TLE_FETCH_TS
    age_ok = _TLE_FETCH_TS and (time.time() - _TLE_FETCH_TS) < settings.TLE_REFRESH_HOURS * 3600
    if age_ok and _TLE_MEM:
        return

    data = await fetch_celestrak_all()
    _TLE_MEM = data
    _TLE_FETCH_TS = time.time()

    r = get_redis()
    if r:
        r.set(KEY_TLE, json.dumps(_TLE_MEM))

def get_tle_map() -> dict[int, tuple] | dict[int, tuple[str, str, str]]:
    r = get_redis()
    if r:
        raw = r.get(KEY_TLE)
        if raw:
            try:
                d = json.loads(raw)
                return {int(k): tuple(v) for k, v in d.items()}
            except Exception:
                pass
    return _TLE_MEM
