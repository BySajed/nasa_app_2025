import redis
from .settings import settings

_redis: redis.Redis | None = None

def get_redis() -> redis.Redis | None:
    global _redis
    if _redis is None and settings.REDIS_URL:
        _redis = redis.from_url(settings.REDIS_URL, decode_responses=True)
    return _redis
