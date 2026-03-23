"""
Pydantic v2 schemas for Risk Profiler Express.

Depends on: pydantic
Used by: api/v1/profile.py
"""

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class RiskProfilerRequest(BaseModel):
    """Request body for Risk Profiler Express."""

    horizon: Literal["court", "moyen", "long"] = Field(
        description="Investment horizon: court (<2y), moyen (2-5y), long (>5y)"
    )
    loss_tolerance: Literal["faible", "modere", "eleve"] = Field(
        description="Loss tolerance level"
    )
    objective: Literal["preservation", "equilibre", "croissance"] = Field(
        description="Investment objective"
    )
    experience: Literal["debutant", "intermediaire", "expert"] = Field(
        description="Investment experience level"
    )


class SuggestedTicker(BaseModel):
    """A single suggested asset with reason."""

    ticker: str
    weight: float
    reason: str


class RiskProfilerResponse(BaseModel):
    """Response from Risk Profiler Express."""

    profile_name: str = Field(description="Named risk profile (e.g. 'Investisseur Prudent')")
    profile_description: str = Field(description="One-sentence profile description")
    suggested_tickers: list[SuggestedTicker] = Field(description="Suggested portfolio allocation")
    risk_score: int = Field(ge=1, le=10, description="Risk score from 1 (conservative) to 10 (aggressive)")


class UserRiskProfileResponse(BaseModel):
    """Stored risk profile from database."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    horizon: str
    loss_tolerance: str
    objective: str
    experience: str
    profile_name: str
    risk_score: int


class UserPreferencesRequest(BaseModel):
    """Request body for updating user preferences."""

    mode: Literal["beginner", "expert"] = Field(
        default="beginner", description="Display mode"
    )
    monte_carlo_simulations: int = Field(
        default=10000, ge=1000, le=10000, description="Number of Monte Carlo simulations"
    )


class UserPreferencesResponse(BaseModel):
    """Stored user preferences."""

    model_config = ConfigDict(from_attributes=True)

    mode: str
    monte_carlo_simulations: int
