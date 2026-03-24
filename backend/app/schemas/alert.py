"""
Pydantic v2 schemas for user alerts and notifications.

Depends on: pydantic
Used by: api/v1/alerts.py
"""

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class AlertCreateRequest(BaseModel):
    """Request to create a new alert."""

    portfolio_id: str = Field(description="Portfolio UUID")
    metric: Literal["var_95", "sharpe", "volatility"] = Field(
        description="Metric to watch"
    )
    threshold: float = Field(description="Threshold value")
    direction: Literal["above", "below"] = Field(
        description="Trigger direction"
    )


class AlertResponse(BaseModel):
    """Alert stored in database."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    portfolio_id: str
    metric: str
    threshold: float
    direction: str
    active: bool
    created_at: str


class NotificationResponse(BaseModel):
    """Notification triggered by an alert."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    alert_id: str
    message: str
    read: bool
    created_at: str
