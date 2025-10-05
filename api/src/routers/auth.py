from fastapi import APIRouter, Depends, HTTPException
from src.services.database import get_session
from src.services.auth import get_password_hash, verify_password, create_access_token
from src.schemas.user_create import UserCreate
from src.schemas.user_login import UserLogin
from src.models.user import User
from sqlmodel import Session, select

router = APIRouter(prefix="/auth")

@router.post("/signup")
def signup(user: UserCreate, session: Session = Depends(get_session)):
    existing = session.exec(select(User).where(User.username == user.username)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already registered")
    hashed = get_password_hash(user.password)
    new_user = User(username=user.username, hashed_password=hashed)
    session.add(new_user)
    session.commit()
    session.refresh(new_user)
    return {"message": "User created"}

@router.post("/login")
def login(user: UserLogin, session: Session = Depends(get_session)):
    db_user = session.exec(select(User).where(User.username == user.username)).first()
    if not db_user or not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=400, detail="Invalid credentials")
    token = create_access_token({"sub": str(db_user.id)})
    return {"access_token": token, "token_type": "bearer"}
