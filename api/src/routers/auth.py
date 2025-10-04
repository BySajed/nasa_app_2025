from fastapi import APIRouter, Depends, HTTPException
from src.services.database import get_session
from src.services.auth import oauth2_scheme, decode_token
from src.services.auth import get_password_hash, verify_password, create_access_token
from src.schemas.user_create import UserCreate
from src.schemas.user_login import UserLogin
from src.models.user import User
from sqlmodel import Session, select


auth_router = APIRouter(prefix="/auth")


def get_current_user(
    token: str = Depends(oauth2_scheme), session: Session = Depends(get_session)
):
    payload = decode_token(token)
    user_id = payload.get("sub")
    user = session.get(User, int(user_id))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@auth_router.post("/signup")
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


@auth_router.post("/login")
def login(user: UserLogin, session: Session = Depends(get_session)):
    db_user = session.exec(select(User).where(User.username == user.username)).first()
    if not db_user or not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=400, detail="Invalid credentials")
    token = create_access_token({"sub": str(db_user.id)})
    return {"access_token": token, "token_type": "bearer"}
