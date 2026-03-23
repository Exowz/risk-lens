"""
Pydantic v2 schemas for AI explanation endpoints.

Depends on: pydantic
Used by: api/v1/risk.py, api/v1/markowitz.py, api/v1/stress.py
"""

from typing import Literal

from pydantic import BaseModel, Field


# ── Shared ──


class ExplanationResponse(BaseModel):
    """AI-generated explanation text."""

    explanation: str = Field(description="Generated explanation in French")


# ── Monte Carlo ──


class ExplainMonteCarloRequest(BaseModel):
    """Request body for Monte Carlo explanation."""

    mode: Literal["beginner", "expert"] = Field(description="UI mode")
    mean_final_value: float
    var_95: float
    probability_of_loss: float
    n_simulations: int = 10_000
    n_days: int = 252


# ── Distribution ──


class ExplainDistributionRequest(BaseModel):
    """Request body for loss distribution explanation."""

    mode: Literal["beginner", "expert"] = Field(description="UI mode")
    var_95: float
    mean_final_value: float
    std_final_value: float
    percentile_5: float
    percentile_95: float


# ── Markowitz ──


class ExplainMarkowitzRequest(BaseModel):
    """Request body for Markowitz frontier position explanation."""

    mode: Literal["beginner", "expert"] = Field(description="UI mode")
    current_sharpe: float
    current_volatility: float
    current_return: float
    max_sharpe_ratio: float
    max_sharpe_volatility: float
    max_sharpe_return: float
    min_variance_volatility: float


# ── Stress ──


class ExplainStressScenario(BaseModel):
    """Single scenario for stress explanation request."""

    scenario_name: str
    total_return: float
    max_drawdown: float
    recovery_days: int | None


class ExplainStressRequest(BaseModel):
    """Request body for stress test explanation."""

    mode: Literal["beginner", "expert"] = Field(description="UI mode")
    scenarios: list[ExplainStressScenario] = Field(min_length=1)


# ── Generic metric ──


class ExplainMetricRequest(BaseModel):
    """Request body for generic metric explanation."""

    metric_name: str = Field(description="Machine-readable metric key (e.g. var_95)")
    metric_value: float = Field(description="Current numeric value of the metric")
    portfolio_id: str = Field(description="Portfolio UUID for context")
    mode: Literal["beginner", "expert"] = Field(description="UI mode")
    context: dict[str, float | str | int | None] = Field(
        default_factory=dict,
        description="Additional context values (e.g. other metrics for comparison)",
    )
