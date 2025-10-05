from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List, TYPE_CHECKING

if TYPE_CHECKING:
    from .spot import Spot
    from .review import Review


class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str
    hashed_password: str
    spots: List["Spot"] = Relationship(back_populates="owner")
    reviews: List["Review"] = Relationship(back_populates="user")


class UserPublic(SQLModel):
    id: int
    username: str
