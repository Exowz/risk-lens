"""
User alerts router — CRUD for metric threshold alerts.

Endpoints:
    POST   /alerts         -- Create a new alert
    GET    /alerts         -- List all alerts for current user
    DELETE /alerts/{id}    -- Delete an alert
    GET    /alerts/notifications -- Get unread notifications

Depends on: schemas/alert.py, models/user_alert.py, core/database.py, core/security.py
Used by: Frontend profile page, dashboard alert banner
"""

import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.user_alert import UserAlert, UserNotification
from app.schemas.alert import AlertCreateRequest, AlertResponse, NotificationResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/alerts", tags=["alerts"])


@router.post("", response_model=AlertResponse)
async def create_alert(
    request: AlertCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> AlertResponse:
    """Create a new metric threshold alert."""
    alert = UserAlert(
        user_id=current_user.id,
        portfolio_id=request.portfolio_id,
        metric=request.metric,
        threshold=request.threshold,
        direction=request.direction,
    )
    db.add(alert)
    await db.commit()
    await db.refresh(alert)

    logger.info(
        "Alert created: user=%s metric=%s threshold=%s direction=%s",
        current_user.id,
        request.metric,
        request.threshold,
        request.direction,
    )
    return AlertResponse.model_validate(alert)


@router.get("", response_model=list[AlertResponse])
async def list_alerts(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[AlertResponse]:
    """List all alerts for the current user."""
    result = await db.execute(
        select(UserAlert)
        .where(UserAlert.user_id == current_user.id)
        .order_by(UserAlert.created_at.desc())
    )
    alerts = result.scalars().all()
    return [AlertResponse.model_validate(a) for a in alerts]


@router.delete("/{alert_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_alert(
    alert_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    """Delete an alert."""
    result = await db.execute(
        select(UserAlert).where(
            UserAlert.id == alert_id,
            UserAlert.user_id == current_user.id,
        )
    )
    alert = result.scalar_one_or_none()
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alert not found",
        )

    await db.delete(alert)
    await db.commit()
    logger.info("Alert deleted: id=%s user=%s", alert_id, current_user.id)


@router.get("/notifications", response_model=list[NotificationResponse])
async def get_notifications(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[NotificationResponse]:
    """Get unread notifications for current user."""
    result = await db.execute(
        select(UserNotification)
        .where(
            UserNotification.user_id == current_user.id,
            UserNotification.read == False,  # noqa: E712
        )
        .order_by(UserNotification.created_at.desc())
        .limit(20)
    )
    notifications = result.scalars().all()
    return [NotificationResponse.model_validate(n) for n in notifications]
