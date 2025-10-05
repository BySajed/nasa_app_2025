from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List, TYPE_CHECKING
from datetime import datetime, timezone

if TYPE_CHECKING:
    from .user import User
    from .review import Review


class Spot(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    latitude: float
    longitude: float
    owner_id: int = Field(foreign_key="user.id")
    created_at: datetime = Field(default_factory=datetime.now(timezone.utc))
    owner: Optional["User"] = Relationship(back_populates="spots")
    reviews: List["Review"] = Relationship(back_populates="spot")


class ReviewRead(SQLModel):
    id: int
    rating: int
    comment: str


class UserReadInSpot(SQLModel):
    id: int
    username: str


class SpotRead(SQLModel):
    id: int
    latitude: float
    longitude: float
    owner_id: int
    created_at: datetime
    owner: UserReadInSpot
    reviews: List[ReviewRead] = []
