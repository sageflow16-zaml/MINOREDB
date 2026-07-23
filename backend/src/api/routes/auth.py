from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from uuid import UUID
from src.api import deps
from src.api.deps import get_db
from src.schemas.auth import (
    UserCreate,
    UserLogin,
    UserRead,
    TokenResponse,
    RefreshRequest,
    TokenRefreshResponse,
)
from src.models.user import User
from src.core.security import hash_password, verify_password
from src.core.jwt import create_access_token, create_refresh_token, decode_token
from src.core.audit import AuditEvent, log_audit

router = APIRouter()


@router.post("/register", response_model=TokenResponse, status_code=201)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    user = User(
        email=user_in.email,
        hashed_password=hash_password(user_in.password),
        name=user_in.name,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    access_token = create_access_token(user.id)
    refresh_token = create_refresh_token(user.id)

    log_audit(AuditEvent("register", actor_id=str(user.id), resource=f"user:{user.id}"))

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserRead.model_validate(user),
    )


@router.post("/login", response_model=TokenResponse)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == credentials.email).first()
    if not user or not verify_password(credentials.password, user.hashed_password):
        log_audit(AuditEvent("login_failed", resource=f"email:{credentials.email}"))
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not user.is_active:
        log_audit(AuditEvent("account_disabled", actor_id=str(user.id), resource=f"user:{user.id}"))
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is disabled",
        )

    access_token = create_access_token(user.id)
    refresh_token = create_refresh_token(user.id)

    log_audit(AuditEvent("login", actor_id=str(user.id), resource=f"user:{user.id}"))

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserRead.model_validate(user),
    )


@router.post("/refresh", response_model=TokenRefreshResponse)
def refresh(body: RefreshRequest, db: Session = Depends(get_db)):
    payload = decode_token(body.refresh_token)
    if payload is None or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )

    user_id_str = payload.get("sub")
    user = db.query(User).filter(User.id == UUID(user_id_str)).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )

    new_access = create_access_token(user.id)
    new_refresh = create_refresh_token(user.id)

    log_audit(AuditEvent("token_refresh", actor_id=str(user.id), resource=f"user:{user.id}"))

    return TokenRefreshResponse(
        access_token=new_access,
        refresh_token=new_refresh,
    )


@router.post("/logout", status_code=204)
def logout(current_user: User = Depends(deps.get_current_user)):
    log_audit(AuditEvent("logout", actor_id=str(current_user.id), resource=f"user:{current_user.id}"))
    return None


@router.get("/me", response_model=UserRead)
def get_me(current_user: User = Depends(deps.get_current_user)):
    return current_user
