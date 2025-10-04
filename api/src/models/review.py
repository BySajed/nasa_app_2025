from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, TYPE_CHECKING

if TYPE_CHECKING:
    from .spot import Spot
    from .user import User


class Review(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    rating: int
    comment: str
    spot_id: int = Field(foreign_key="spot.id")
    user_id: int = Field(foreign_key="user.id")
    spot: Optional["Spot"] = Relationship(back_populates="reviews")
    user: Optional["User"] = Relationship(back_populates="reviews")
