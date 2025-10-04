from pydantic_settings import BaseSettings
from pydantic import Field
from typing import List

class Settings(BaseSettings):
    # Observer defaults (alt in meters)
    DEFAULT_OBSERVER_ALT_M: int = 35

    # Pagination & tracks
    DEFAULT_LIMIT: int = 30
    MAX_LIMIT: int = 100
    DEFAULT_TRACK_HORIZON_MIN: int = 15
    DEFAULT_TRACK_STEP_SEC: int = 30

    # CelesTrak sources
    CELESTRAK_URLS: List[str] = Field(
        default_factory=lambda: [
            "https://celestrak.org/NORAD/elements/gp.php?GROUP=stations&FORMAT=tle",
            "https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=tle",
            "https://celestrak.org/NORAD/elements/gp.php?GROUP=visual&FORMAT=tle",
            "https://celestrak.org/NORAD/elements/gp.php?GROUP=starlink&FORMAT=tle",
            "https://celestrak.org/NORAD/elements/gp.php?GROUP=oneweb&FORMAT=tle",
            "https://celestrak.org/NORAD/elements/gp.php?GROUP=geostationary&FORMAT=tle",
            "https://celestrak.org/NORAD/elements/gp.php?GROUP=weather&FORMAT=tle",
            "https://celestrak.org/NORAD/elements/gp.php?GROUP=earth-observation&FORMAT=tle",
            "https://celestrak.org/NORAD/elements/gp.php?GROUP=communications&FORMAT=tle",
            "https://celestrak.org/NORAD/elements/gp.php?GROUP=science&FORMAT=tle",
        ]
    )

    # Space-Track
    SPACETRACK_USERNAME: str | None = None
    SPACETRACK_PASSWORD: str | None = None

    # Cache
    REDIS_URL: str | None = None
    TLE_REFRESH_HOURS: int = 6
    TLE_FETCH_RETRIES: int = 3
    TLE_FETCH_BACKOFF_SECONDS: float = 1.5

    class Config:
        env_file = ".env"

settings = Settings()
