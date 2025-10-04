from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List
from src.models.user import User
from src.models.review import Review

class Spot(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    image_url: Optional[str] = None
    owner_id: int = Field(foreign_key="user.id")
    owner: Optional[User] = Relationship(back_populates="spots")
    reviews: List["Review"] = Relationship(back_populates="spot")