from typing import List
from fastapi import APIRouter, Depends, HTTPException
from src.services.database import get_session
from src.services.auth import get_current_user
from src.schemas.spot_create import SpotCreate
from src.schemas.review_create import ReviewCreate
from src.models.spot import Spot, SpotRead
from src.models.review import Review
from src.models.user import User
from sqlmodel import Session, select
from sqlalchemy.orm import selectinload

spots_router = APIRouter(prefix="/spots")


@spots_router.post("/")
def create_spot(
    spot: SpotCreate,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    new_spot = Spot(
        name=spot.name,
        description=spot.description,
        city=spot.city,
        country=spot.country,
        latitude=spot.latitude,
        longitude=spot.longitude,
        owner_id=user.id,
    )
    session.add(new_spot)
    session.commit()
    session.refresh(new_spot)
    return new_spot


@spots_router.get("/", response_model=List[SpotRead])
def list_spots(session: Session = Depends(get_session)):
    spots = session.exec(select(Spot).options(selectinload(Spot.reviews))).all()
    return spots


@spots_router.post("/reviews")
def create_review(
    review: ReviewCreate,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    spot = session.get(Spot, review.spot_id)
    if not spot:
        raise HTTPException(status_code=404, detail="Spot not found")

    if review.rating < 1 or review.rating > 5:
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")

    new_review = Review(**review.model_dump(), user_id=user.id)
    session.add(new_review)
    session.commit()
    session.refresh(new_review)
    return new_review
