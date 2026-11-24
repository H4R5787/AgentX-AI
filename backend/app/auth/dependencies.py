from __future__ import annotations
from fastapi import Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.auth.security import decode_token
from app.auth.service import get_user_by_id
from app.auth.models import User
from app.common.exceptions import UnauthorizedError

bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    if not credentials:
        raise UnauthorizedError("Not authenticated")
    payload = decode_token(credentials.credentials)
    if payload.type != "access":
        raise UnauthorizedError("Invalid token type")
    user = await get_user_by_id(db, payload.sub)
    if not user:
        raise UnauthorizedError("User not found")
    if not user.is_active:
        raise UnauthorizedError("Inactive user")
    return user


async def get_current_active_user(user: User = Depends(get_current_user)) -> User:
    return user
