"""
User profile and Risk Profiler Express router.

Endpoints:
    POST /profile/risk-profiler -- Generate AI risk profile from questionnaire
    GET  /profile/risk-profile  -- Get stored risk profile

Depends on: schemas/profile.py, services/risk_profiler_service.py,
            models/user_risk_profile.py, core/database.py, core/security.py
Used by: Frontend risk profiler modal, profile page
"""

import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.user_risk_profile import UserRiskProfile
from app.schemas.profile import (
    RiskProfilerRequest,
    RiskProfilerResponse,
    UserRiskProfileResponse,
)
from app.services.risk_profiler_service import generate_risk_profile

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/profile", tags=["profile"])


@router.post("/risk-profiler", response_model=RiskProfilerResponse)
async def risk_profiler(
    request: RiskProfilerRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> RiskProfilerResponse:
    """Generate a personalized risk profile using AI."""
    try:
        result = await generate_risk_profile(
            horizon=request.horizon,
            loss_tolerance=request.loss_tolerance,
            objective=request.objective,
            experience=request.experience,
        )
    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(e),
        ) from e

    # Save to database (upsert — one profile per user)
    existing = await db.execute(
        select(UserRiskProfile).where(UserRiskProfile.user_id == current_user.id)
    )
    profile = existing.scalar_one_or_none()

    if profile:
        profile.horizon = request.horizon
        profile.loss_tolerance = request.loss_tolerance
        profile.objective = request.objective
        profile.experience = request.experience
        profile.profile_name = result["profile_name"]
        profile.risk_score = result["risk_score"]
    else:
        profile = UserRiskProfile(
            user_id=current_user.id,
            horizon=request.horizon,
            loss_tolerance=request.loss_tolerance,
            objective=request.objective,
            experience=request.experience,
            profile_name=result["profile_name"],
            risk_score=result["risk_score"],
        )
        db.add(profile)

    await db.commit()

    logger.info(
        "Risk profile generated for user=%s: %s (score=%d)",
        current_user.id,
        result["profile_name"],
        result["risk_score"],
    )

    return RiskProfilerResponse(**result)


@router.get("/risk-profile")
async def get_risk_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> UserRiskProfileResponse | None:
    """Get the stored risk profile for the current user."""
    result = await db.execute(
        select(UserRiskProfile).where(UserRiskProfile.user_id == current_user.id)
    )
    profile = result.scalar_one_or_none()
    if not profile:
        return None
    return UserRiskProfileResponse.model_validate(profile)
