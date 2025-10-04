from fastapi import APIRouter
from src.services.weather import WeatherService

weather_router = APIRouter(prefix="/weather", tags=["weather"])

@weather_router.get("/")
async def get_weather(latitude: float, longitude: float):
    return await WeatherService.get_weather(latitude, longitude)

