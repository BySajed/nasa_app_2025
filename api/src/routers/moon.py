from fastapi import APIRouter
from src.services.moon import MoonService

router = APIRouter(prefix="/moon", tags=["moon"])


@router.get("/")
async def get_moon(lat: float, lon: float):
    return await MoonService.get_moon_info(lat, lon)
