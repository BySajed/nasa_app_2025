from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List, TYPE_CHECKING

if TYPE_CHECKING:
    from .user import User
    from .review import Review


class Spot(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    description: str
    city: str
    country: str
    latitude: float
    longitude: float
    owner_id: int = Field(foreign_key="user.id")
    owner: Optional["User"] = Relationship(back_populates="spots")
    reviews: List["Review"] = Relationship(back_populates="spot")
    
class ReviewRead(SQLModel):
    id: int
    rating: int
    comment: str

class SpotRead(SQLModel):
    id: int
    name: str
    description: str
    city: str
    country: str
    latitude: float
    longitude: float
    owner_id: int
    reviews: List[ReviewRead] = []
