import requests
import os
from datetime import datetime

class MoonService:
    base_url = "https://moon-phase.p.rapidapi.com"

    @staticmethod
    def get_advanced_url(lat: float, lon: float) -> str:
        return f"{MoonService.base_url}/advanced?lat={lat}&lon={lon}"

    @staticmethod
    async def get_moon_info(lat: float, lon: float):
        lat = round(lat, 1)
        lon = round(lon, 1)
        print(os.getenv("RAPIDAPI_KEY"))

        res = requests.get(
            MoonService.get_advanced_url(lat, lon),
            headers={
                "X-RapidAPI-Key": os.getenv("RAPIDAPI_KEY"),
                "X-RapidAPI-Host": "moon-phase.p.rapidapi.com",
            },
        )

        if res.status_code == 200:
            data = res.json()

            # Update main datestamp
            data["datestamp"] = datetime.fromtimestamp(data["timestamp"]).strftime(
                "%a, %d %b %Y %H:%M:%S"
            )
            # Update sun timestamps
            temp = data["sun"]["sunrise"]
            data["sun"]["sunrise"] = datetime.fromtimestamp(
                temp
            ).strftime("%H:%M")
            data["sun"]["sunrise_timestamp"] = temp
            
            temp = data["sun"]["sunset"]
            # Update sun timestamps
            data["sun"]["sunset"] = datetime.fromtimestamp(
                temp
            ).strftime("%H:%M")
            data["sun"]["sunset_timestamp"] = temp
            
            data["sun"]["next_solar_eclipse"]["datestamp"] = datetime.fromtimestamp(
                data["sun"]["next_solar_eclipse"]["timestamp"]
            ).strftime("%a, %d %b %Y %H:%M:%S")

            # Update moon timestamps
            data["moon"]["moonrise"] = datetime.fromtimestamp(
                data["moon"]["moonrise_timestamp"]
            ).strftime("%H:%M")
            data["moon"]["moonset"] = datetime.fromtimestamp(
                data["moon"]["moonset_timestamp"]
            ).strftime("%H:%M")
            data["moon"]["next_lunar_eclipse"]["datestamp"] = datetime.fromtimestamp(
                data["moon"]["next_lunar_eclipse"]["timestamp"]
            ).strftime("%a, %d %b %Y %H:%M:%S")

            # Update upcoming phases timestamps
            upcoming_phases = data["moon"]["detailed"]["upcoming_phases"]

            # New moon timestamps
            upcoming_phases["new_moon"]["last"]["datestamp"] = datetime.fromtimestamp(
                upcoming_phases["new_moon"]["last"]["timestamp"]
            ).strftime("%a, %d %b %Y %H:%M:%S")
            upcoming_phases["new_moon"]["next"]["datestamp"] = datetime.fromtimestamp(
                upcoming_phases["new_moon"]["next"]["timestamp"]
            ).strftime("%a, %d %b %Y %H:%M:%S")

            # First quarter timestamps
            upcoming_phases["first_quarter"]["last"]["datestamp"] = (
                datetime.fromtimestamp(
                    upcoming_phases["first_quarter"]["last"]["timestamp"]
                ).strftime("%a, %d %b %Y %H:%M:%S")
            )
            upcoming_phases["first_quarter"]["next"]["datestamp"] = (
                datetime.fromtimestamp(
                    upcoming_phases["first_quarter"]["next"]["timestamp"]
                ).strftime("%a, %d %b %Y %H:%M:%S")
            )

            # Full moon timestamps
            upcoming_phases["full_moon"]["last"]["datestamp"] = datetime.fromtimestamp(
                upcoming_phases["full_moon"]["last"]["timestamp"]
            ).strftime("%a, %d %b %Y %H:%M:%S")
            upcoming_phases["full_moon"]["next"]["datestamp"] = datetime.fromtimestamp(
                upcoming_phases["full_moon"]["next"]["timestamp"]
            ).strftime("%a, %d %b %Y %H:%M:%S")

            # Last quarter timestamps
            upcoming_phases["last_quarter"]["last"]["datestamp"] = (
                datetime.fromtimestamp(
                    upcoming_phases["last_quarter"]["last"]["timestamp"]
                ).strftime("%a, %d %b %Y %H:%M:%S")
            )
            upcoming_phases["last_quarter"]["next"]["datestamp"] = (
                datetime.fromtimestamp(
                    upcoming_phases["last_quarter"]["next"]["timestamp"]
                ).strftime("%a, %d %b %Y %H:%M:%S")
            )

            return data

        return res.json()
