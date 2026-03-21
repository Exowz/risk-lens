"""
Pydantic v2 schemas for portfolio CRUD operations.

Validates that portfolio asset weights sum to 1.0 (±0.001).
Validates ticker format (uppercase alphanumeric, max 10 chars).

Depends on: pydantic
Used by: api/v1/portfolios.py
"""

import re
from datetime import datetime

from pydantic import BaseModel, Field, field_validator


class AssetInput(BaseModel):
    """Single asset in a portfolio creation/update request."""

    ticker: str = Field(min_length=1, max_length=10, description="Ticker symbol (e.g., AAPL)")
    weight: float = Field(gt=0, le=1, description="Asset weight (0 < w <= 1)")

    @field_validator("ticker")
    @classmethod
    def validate_ticker_format(cls, v: str) -> str:
        """Ensure ticker is uppercase alphanumeric with optional dot/dash."""
        v = v.upper().strip()
        if not re.match(r"^[A-Z0-9.\-]{1,10}$", v):
            raise ValueError(
                f"Invalid ticker format: '{v}'. Use uppercase letters, numbers, dots, or dashes."
            )
        return v


class PortfolioCreateRequest(BaseModel):
    """Request body for creating a new portfolio."""

    name: str = Field(min_length=1, max_length=100, description="Portfolio name")
    assets: list[AssetInput] = Field(min_length=1, max_length=20, description="List of assets")

    @field_validator("assets")
    @classmethod
    def weights_must_sum_to_one(cls, assets: list[AssetInput]) -> list[AssetInput]:
        """Validate that asset weights sum to 1.0 (±0.001)."""
        total = sum(a.weight for a in assets)
        if abs(total - 1.0) > 0.001:
            raise ValueError(f"Weights must sum to 1.0, got {total:.4f}")
        return assets

    @field_validator("assets")
    @classmethod
    def no_duplicate_tickers(cls, assets: list[AssetInput]) -> list[AssetInput]:
        """Ensure no duplicate tickers in the same portfolio."""
        tickers = [a.ticker for a in assets]
        if len(tickers) != len(set(tickers)):
            raise ValueError("Duplicate tickers are not allowed in a single portfolio")
        return assets


class AssetResponse(BaseModel):
    """Single asset in a portfolio response."""

    id: str
    ticker: str
    weight: float

    model_config = {"from_attributes": True}


class PortfolioResponse(BaseModel):
    """Response body for a portfolio."""

    id: str
    name: str
    assets: list[AssetResponse]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PortfolioListResponse(BaseModel):
    """Response body for listing portfolios (without full asset details)."""

    id: str
    name: str
    asset_count: int
    created_at: datetime
    updated_at: datetime
