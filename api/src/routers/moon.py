from fastapi import APIRouter
from src.services.moon import MoonService

moon_router = APIRouter(prefix="/moon", tags=["moon"])


@moon_router.get("/")
async def get_moon(latitude: float, longitude: float):
    return await MoonService.get_moon_info(latitude, longitude)
