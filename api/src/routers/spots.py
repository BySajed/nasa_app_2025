from fastapi import APIRouter, Depends
from src.services.database import get_session
from src.services.auth import get_current_user
from src.schemas.spot_create import SpotCreate
from src.schemas.review_create import ReviewCreate
from src.models.spot import Spot
from src.models.review import Review
from src.models.user import User
from sqlmodel import Session, select

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


@spots_router.get("/")
def list_spots(session: Session = Depends(get_session)):
    return session.exec(select(Spot)).all()


@spots_router.post("/reviews")
def create_review(
    review: ReviewCreate,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    new_review = Review(**review.model_dump(), user_id=user.id)
    session.add(new_review)
    session.commit()
    session.refresh(new_review)
    return new_review
