from pydantic import BaseModel
from typing import List
from .common import Observer
from .objects import SkyObject

class Paging(BaseModel):
    limit: int
    offset: int
    total_estimated: int

class AboveResponse(BaseModel):
    observer: Observer
    paging: Paging
    objects: List[SkyObject]

class DetailsResponse(BaseModel):
    object_id: str
    kind: str
    name: str
    info: dict
