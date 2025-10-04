from fastapi import APIRouter
from datetime import datetime
from src.services.sky_visualization.stars import get_visible_stars
from src.services.sky_visualization.solar_system import get_solar_system_positions
from typing import Optional

sky_router = APIRouter(prefix="/sky")


@sky_router.get("/stars")
def get_stars(lat: float, lon: float, height: float = 0, time: Optional[str] = None):

    if time:
        time = datetime.fromisoformat(time)
    else:
        time = datetime.now()

    stars = get_visible_stars(lat, lon, height, time)
    return {"stars": stars}


@sky_router.get("/solar-system")
def get_solar_system(lat: float, lon: float):
    time = datetime.now()
    planets = get_solar_system_positions(lat, lon, 0, time)
    return {"planets": planets}
