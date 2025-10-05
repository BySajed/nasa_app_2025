from pydantic import BaseModel


class SpotCreate(BaseModel):
    latitude: float
    longitude: float