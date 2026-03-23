"""
Pydantic v2 schemas for Markowitz efficient frontier endpoint.

Depends on: pydantic
Used by: api/v1/markowitz.py
"""

from pydantic import BaseModel, Field


class MarkowitzRequest(BaseModel):
    """Request body for efficient frontier computation."""

    portfolio_id: str = Field(description="Portfolio UUID")
    n_points: int = Field(
        default=100,
        ge=10,
        le=500,
        description="Number of points on the frontier curve",
    )
    period: str = Field(
        default="2y",
        description="Historical data period (yfinance format)",
    )


class FrontierPoint(BaseModel):
    """A single point on the efficient frontier."""

    volatility: float = Field(description="Annualized volatility (std dev)")
    expected_return: float = Field(description="Annualized expected return")


class PortfolioWeights(BaseModel):
    """Optimal portfolio weights."""

    weights: dict[str, float] = Field(
        description="Ticker -> weight mapping (sum to 1.0)"
    )
    expected_return: float
    volatility: float
    sharpe_ratio: float


class PortfolioPoint(BaseModel):
    """Current portfolio's position on the risk-return plot."""

    volatility: float
    expected_return: float
    sharpe_ratio: float


class MarkowitzResponse(BaseModel):
    """Efficient frontier computation result."""

    frontier_points: list[FrontierPoint] = Field(
        description="Points along the efficient frontier curve"
    )
    min_variance: PortfolioWeights = Field(
        description="Minimum variance portfolio"
    )
    max_sharpe: PortfolioWeights = Field(
        description="Maximum Sharpe ratio portfolio"
    )
    current_portfolio: PortfolioPoint = Field(
        description="Current portfolio's position on the plot"
    )
    from_cache: bool = False
