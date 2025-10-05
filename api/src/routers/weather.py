from fastapi import APIRouter
from src.services.weather import WeatherService

router = APIRouter(prefix="/weather", tags=["weather"])

@router.get("/")
async def get_weather(latitude: float, longitude: float):
    return await WeatherService.get_weather(latitude, longitude)
