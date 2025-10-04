from sqlmodel import SQLModel, Field, Relationship
from typing import Optional
from src.models.spot import Spot
from src.models.user import User


class Review(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    rating: int
    comment: str
    spot_id: int = Field(foreign_key="spot.id")
    user_id: int = Field(foreign_key="user.id")
    spot: Optional[Spot] = Relationship(back_populates="reviews")
    user: Optional[User] = Relationship(back_populates="reviews")
