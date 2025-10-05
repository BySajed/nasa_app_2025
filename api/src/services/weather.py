import requests

class WeatherService:
    base_url = "https://api.open-meteo.com/v1/forecast"
    query_params = "?current=temperature_2m,rain,is_day,relative_humidity_2m,precipitation,cloud_cover,snowfall,showers"

    @staticmethod
    def get_url(latitude: float, longitude: float) -> str:
        return f"{WeatherService.base_url}{WeatherService.query_params}&latitude={latitude}&longitude={longitude}"

    @staticmethod
    async def get_weather(latitude: float, longitude: float):
        res = requests.get(WeatherService.get_url(latitude, longitude))
        return res.json()