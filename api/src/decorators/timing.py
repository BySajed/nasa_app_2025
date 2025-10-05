import time
import logging
from functools import wraps

logger = logging.getLogger("api")

def timed(name: str):
    def deco(fn):
        @wraps(fn)
        async def inner(*args, **kwargs):
            t0 = time.perf_counter()
            try:
                return await fn(*args, **kwargs)
            finally:
                dt = (time.perf_counter() - t0) * 1000
                logger.info(f"{name} took {dt:.1f} ms")
        return inner
    return deco
