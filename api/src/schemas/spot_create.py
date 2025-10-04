from pydantic import BaseModel


class SpotCreate(BaseModel):
    name: str
    image_url: str | None = None