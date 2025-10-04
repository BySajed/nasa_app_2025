from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List
from src.models.spot import Spot
from src.models.review import Review

class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str
    email: str
    hashed_password: str
    spots: List["Spot"] = Relationship(back_populates="owner")
    reviews: List["Review"] = Relationship(back_populates="user")
