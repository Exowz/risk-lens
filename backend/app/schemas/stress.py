"""
Pydantic v2 schemas for stress testing endpoint.

Depends on: pydantic
Used by: api/v1/stress.py
"""

from pydantic import BaseModel, Field


class StressTestRequest(BaseModel):
    """Request body for stress test computation."""

    portfolio_id: str = Field(description="Portfolio UUID")
    period: str = Field(
        default="max",
        description="Historical data period for fetching prices (yfinance format)",
    )


class ScenarioResult(BaseModel):
    """Result of a single crisis scenario stress test."""

    scenario_name: str = Field(description="Human-readable scenario name")
    start_date: str = Field(description="Scenario start date (YYYY-MM-DD)")
    end_date: str = Field(description="Scenario end date (YYYY-MM-DD)")
    total_return: float = Field(description="Cumulative return over the period")
    max_drawdown: float = Field(description="Maximum peak-to-trough decline (negative)")
    recovery_days: int | None = Field(
        description="Trading days from trough to recovery (None if not recovered)"
    )


class ScenarioComparison(BaseModel):
    """Comparison of current portfolio vs Markowitz-optimised for a scenario."""

    scenario_name: str
    current_drawdown: float = Field(description="Max drawdown of current portfolio")
    optimized_drawdown: float = Field(
        description="Max drawdown of max-Sharpe optimised portfolio"
    )


class StressTestResponse(BaseModel):
    """Stress test computation result."""

    scenarios: list[ScenarioResult] = Field(
        description="Results for each crisis scenario"
    )
    comparisons: list[ScenarioComparison] = Field(
        description="Current vs optimised drawdown per scenario"
    )
    from_cache: bool = False
