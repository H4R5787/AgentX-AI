from __future__ import annotations
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.auth.schemas import UserCreate, UserLogin, UserResponse, Token, RefreshRequest
from app.auth.service import create_user, authenticate_user, get_user_by_id
from app.auth.security import create_access_token, create_refresh_token, decode_token
from app.auth.dependencies import get_current_user
from app.auth.models import User
from app.common.exceptions import UnauthorizedError

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserResponse, status_code=201)
async def register(user_in: UserCreate, db: AsyncSession = Depends(get_db)):
    user = await create_user(db, user_in)
    return user


@router.post("/login", response_model=Token)
async def login(user_in: UserLogin, db: AsyncSession = Depends(get_db)):
    user = await authenticate_user(db, user_in.email, user_in.password)
    access_token = create_access_token({"sub": user.id})
    refresh_token = create_refresh_token({"sub": user.id})
    return Token(access_token=access_token, refresh_token=refresh_token)


@router.post("/refresh", response_model=Token)
async def refresh(request: RefreshRequest, db: AsyncSession = Depends(get_db)):
    payload = decode_token(request.refresh_token)
    if payload.type != "refresh":
        raise UnauthorizedError("Invalid token type")
    user = await get_user_by_id(db, payload.sub)
    if not user or not user.is_active:
        raise UnauthorizedError("User not found or inactive")
    access_token = create_access_token({"sub": user.id})
    new_refresh = create_refresh_token({"sub": user.id})
    return Token(access_token=access_token, refresh_token=new_refresh)


@router.get("/me", response_model=UserResponse)
async def me(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/logout", status_code=204)
async def logout(current_user: User = Depends(get_current_user)):
    # Token invalidation via Redis blocklist would go here.
    # For now, client-side logout is sufficient (stateless JWT).
    return None
