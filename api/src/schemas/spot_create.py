from pydantic import BaseModel


class SpotCreate(BaseModel):
    name: str
    description: str
    city: str
    country: str
    latitude: float
    longitude: float
    