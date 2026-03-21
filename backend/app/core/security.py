"""
BetterAuth session verification and get_current_user FastAPI dependency.

BetterAuth uses opaque session tokens (NOT JWTs). The token from the
Authorization: Bearer header is looked up in the shared PostgreSQL
``session`` table. If valid and not expired, the corresponding BetterAuth
``user`` row is resolved and synced into our application ``users`` table.

Depends on: core/config.py, core/database.py, models/user.py
Used by: all protected API routers
"""

import logging
from datetime import datetime, timezone

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.user import User

logger = logging.getLogger(__name__)

bearer_scheme = HTTPBearer()


async def _get_betterauth_session(
    db: AsyncSession, token: str
) -> dict[str, str] | None:
    """
    Look up a BetterAuth session by its opaque token.

    Returns a dict with userId, or None if not found / expired.
    """
    result = await db.execute(
        text(
            'SELECT "userId", "expiresAt" FROM session WHERE token = :token'
        ),
        {"token": token},
    )
    row = result.mappings().first()

    if row is None:
        return None

    # Check expiration
    expires_at: datetime = row["expiresAt"]
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    if expires_at < datetime.now(timezone.utc):
        logger.info("Session token expired for userId=%s", row["userId"])
        return None

    return {"userId": row["userId"]}


async def _get_or_create_user(
    db: AsyncSession, betterauth_user_id: str
) -> User:
    """
    Resolve a BetterAuth userId to our application User.

    If the user doesn't exist in our ``users`` table yet, fetch their
    profile from the BetterAuth ``user`` table and create a synced record.
    """
    from sqlalchemy import select

    # Check our users table first
    result = await db.execute(
        select(User).where(User.id == betterauth_user_id)
    )
    user = result.scalar_one_or_none()
    if user is not None:
        return user

    # User exists in BetterAuth but not in our table — sync them
    ba_result = await db.execute(
        text('SELECT id, email, name FROM "user" WHERE id = :id'),
        {"id": betterauth_user_id},
    )
    ba_user = ba_result.mappings().first()

    if ba_user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found in auth provider",
        )

    # Create the synced user with the same ID as BetterAuth
    user = User(
        id=ba_user["id"],
        email=ba_user["email"],
        name=ba_user["name"],
        hashed_password="",  # Auth is handled by BetterAuth, not us
    )
    db.add(user)
    await db.flush()

    logger.info(
        "Synced BetterAuth user to app: id=%s email=%s",
        user.id,
        user.email,
    )
    return user


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    FastAPI dependency that verifies a BetterAuth session token and
    returns the corresponding application User.

    Flow:
        1. Extract Bearer token from Authorization header
        2. Look up token in BetterAuth ``session`` table
        3. Resolve userId to our ``users`` table (auto-create if needed)

    Raises:
        HTTPException 401 if token is missing, invalid, or expired.
    """
    token = credentials.credentials

    session_data = await _get_betterauth_session(db, token)
    if session_data is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session token",
        )

    user = await _get_or_create_user(db, session_data["userId"])
    return user
