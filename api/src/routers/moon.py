from fastapi import APIRouter
from src.services.moon import MoonService

moon_router = APIRouter(prefix="/moon", tags=["moon"])


@moon_router.get("/")
async def get_moon(lat: float, lon: float):
    return await MoonService.get_moon_info(lat, lon)
