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
from datetime import datetime, timezone
from sqlalchemy.orm import selectinload

router = APIRouter(prefix="/spots", tags=["spots"])


@router.post("/")
def create_spot(
    spot: SpotCreate,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    new_spot = Spot(
        latitude=spot.latitude,
        longitude=spot.longitude,
        owner_id=user.id,
        created_at=datetime.now(timezone.utc),
    )
    session.add(new_spot)
    session.commit()
    session.refresh(new_spot)
    return new_spot


@router.get("/", response_model=List[SpotRead])
def list_spots(session: Session = Depends(get_session)):
    spots = session.exec(
        select(Spot).options(selectinload(Spot.reviews), selectinload(Spot.owner))
    ).all()
    return spots


@router.delete("/{spot_id}")
def delete_spot(
    spot_id: int,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    spot = session.get(Spot, spot_id)
    if not spot:
        raise HTTPException(status_code=404, detail="Spot not found")
    if spot.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Not allowed to delete this spot")
    if len(spot.reviews) > 0:
        raise HTTPException(status_code=400, detail="Spot has reviews")
    session.delete(spot)
    session.commit()
    return {"status": "deleted", "id": spot_id}


@router.post("/reviews")
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
