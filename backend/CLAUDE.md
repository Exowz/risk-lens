# CLAUDE.md -- backend/

This file extends the root CLAUDE.md with backend-specific rules.
Read the root CLAUDE.md first, then this file.

---

## CONTEXT

This is the FastAPI backend for RiskLens.
It is the single source of truth for all data and calculations.
Next.js never connects to PostgreSQL directly -- everything goes through this API.

---

## PROJECT STRUCTURE RULES

### Strict layer separation

Routers (/api/v1/)     -- HTTP in/out only. Validate input, call service, return response.
Services (/services/)  -- All business logic and calculations. Pure functions where possible.
Models (/models/)      -- SQLAlchemy ORM table definitions only. No logic.
Schemas (/schemas/)    -- Pydantic v2 request/response shapes only. No logic.
Core (/core/)          -- Config, security, database session. Infrastructure only.

A router that contains calculation logic is a bug.
A service that imports from /api/ is a bug.

### Dependency direction

routers -> services -> models
routers -> schemas
core -> everything (config, db, security are imported anywhere)

---

## FASTAPI RULES

### Router pattern

Every router follows this exact pattern:

```python
# api/v1/risk.py
from fastapi import APIRouter, Depends, HTTPException
from app.core.security import get_current_user
from app.models.user import User
from app.schemas.risk import VaRRequest, VaRResponse
from app.services.risk_engine import calculate_var

router = APIRouter(prefix="/risk", tags=["risk"])

@router.post("/var", response_model=VaRResponse)
async def get_var(
    request: VaRRequest,
    current_user: User = Depends(get_current_user),
) -> VaRResponse:
    """
    Calculate Value at Risk for a portfolio.
    Requires authentication. Results cached for 1h.
    """
    return await calculate_var(
        portfolio_id=request.portfolio_id,
        user_id=current_user.id,
        confidence_level=request.confidence_level,
        method=request.method,
    )
```

### Authentication

Every endpoint that touches user data uses:
    current_user: User = Depends(get_current_user)

get_current_user is defined in core/security.py.
It decodes the JWT sent by BetterAuth from the Authorization header.
It raises 401 automatically if token is missing or invalid.

### Error handling

Use HTTPException with explicit status codes:
- 400 -- bad request (invalid ticker format, malformed input)
- 401 -- unauthorized (missing/invalid JWT)
- 404 -- not found (portfolio not found for this user)
- 422 -- validation error (weights dont sum to 1.0, ticker not found on yfinance)
- 429 -- rate limit exceeded
- 500 -- unexpected server error (log it, return generic message)

Never expose internal error details (stack traces, SQL errors) in 500 responses.

---

## DATABASE RULES

### SQLAlchemy async

All DB operations are async. Use AsyncSession everywhere.

```python
# CORRECT
async def get_portfolio(db: AsyncSession, portfolio_id: str, user_id: str):
    result = await db.execute(
        select(Portfolio).where(
            Portfolio.id == portfolio_id,
            Portfolio.user_id == user_id,
        )
    )
    return result.scalar_one_or_none()

# WRONG
def get_portfolio(db: Session, portfolio_id: str):  # sync -- never
    return db.query(Portfolio).filter(...).first()
```

### Session injection

Sessions are injected via dependency:

```python
from app.core.database import get_db
from sqlalchemy.ext.asyncio import AsyncSession

@router.get("/{id}")
async def get_item(
    id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ...
```

### Migrations

Every schema change requires an Alembic migration.
Never modify the DB manually.
Command: uv run alembic revision --autogenerate -m "description"

---

## CALCULATION CACHE RULES

Heavy computations (VaR, Monte Carlo, Markowitz, stress tests) check the cache first.

Cache key = sha256(portfolio_id + sorted(asset_weights) + params)
Cache TTL = 3600 seconds (1h)
Cache table = calculation_cache (see models/calculation_cache.py)

```python
# services/risk_engine.py pattern
async def calculate_var(
    portfolio_id: str,
    user_id: str,
    confidence_level: float,
    method: str,
    db: AsyncSession,
) -> VaRResult:
    cache_key = build_cache_key(portfolio_id, confidence_level, method)
    cached = await get_cached_result(db, cache_key)
    if cached:
        return VaRResult(**cached, from_cache=True)

    # run actual calculation
    result = _compute_var(...)

    await store_cached_result(db, cache_key, result, ttl=3600)
    return result
```

---

## QUANTITATIVE ENGINE RULES

### market_data.py

yfinance is the only source of market data.
Always validate the ticker exists before fetching historical data.
Cache fetched OHLCV data in memory (functools.lru_cache or similar) for 1h.
Return daily returns as np.ndarray, not DataFrame, to calculation functions.

```python
async def get_daily_returns(tickers: list[str], period: str = "2y") -> dict[str, np.ndarray]:
    """
    Fetch and return daily log returns for a list of tickers.
    Raises HTTPException 422 if any ticker is invalid.
    """
    ...
```

### risk_engine.py

Implements: calculate_var, calculate_cvar, get_risk_summary
Inputs: np.ndarray of returns, scalar params
Outputs: Pydantic result schema instances
No DB access -- pure calculation functions called by routers after cache check

VaR formula reference:
- Historical: np.percentile(returns, (1 - confidence_level) * 100)
- Parametric: mean - z_score * std  (z=1.645 for 95%, z=2.326 for 99%)
- CVaR: mean of returns below VaR threshold

### montecarlo_engine.py

Implements: run_monte_carlo
Parameters: returns array, n_simulations=10000, n_days=252
Model: Geometric Brownian Motion (GBM)
Returns: matrix of shape (n_simulations, n_days) + summary stats

```python
def run_monte_carlo(
    returns: np.ndarray,
    n_simulations: int = 10_000,
    n_days: int = 252,
    initial_value: float = 1.0,
) -> MonteCarloResult:
    mu = np.mean(returns)
    sigma = np.std(returns)
    dt = 1 / 252
    # GBM: S(t+dt) = S(t) * exp((mu - 0.5*sigma^2)*dt + sigma*sqrt(dt)*Z)
    ...
```

### markowitz_engine.py

Uses PyPortfolioOpt exclusively -- no manual matrix inversion.
Returns: frontier points (risk, return), min_variance_weights, max_sharpe_weights.

```python
from pypfopt import EfficientFrontier, risk_models, expected_returns

def compute_efficient_frontier(
    prices: pd.DataFrame,
    n_points: int = 100,
) -> MarkowitzResult:
    mu = expected_returns.mean_historical_return(prices)
    S = risk_models.sample_cov(prices)
    ...
```

### stress_engine.py

Three hard-coded crisis scenarios with exact date ranges:
- crisis_2008: 2008-09-01 to 2009-03-31
- covid_2020:  2020-02-01 to 2020-04-30
- rates_2022:  2022-01-01 to 2022-10-31

For each scenario, compute:
- total_return: cumulative return over the period
- max_drawdown: maximum peak-to-trough decline
- recovery_days: trading days from trough to recovery (or None if not recovered)

### mistral_service.py

Model: mistral-small-latest
Max tokens: 1500 (sufficient for a risk report)
Temperature: 0.3 (low -- we want consistent, factual output)

The prompt must include all quantitative results as structured context.
The output must be structured with these sections:
1. Portfolio profile summary
2. Main risk factors
3. Stress test analysis
4. Rebalancing recommendations
5. Legal disclaimer (not financial advice)

Never log the full Mistral response -- it may contain user portfolio data.

### pdf_service.py

Uses WeasyPrint to convert an HTML template to PDF.
The HTML template is in backend/templates/report.html (Jinja2).
The PDF is returned as a StreamingResponse with content-type application/pdf.

---

## PYDANTIC SCHEMA RULES

All schemas use Pydantic v2 syntax.

```python
# CORRECT -- Pydantic v2
from pydantic import BaseModel, Field, field_validator

class PortfolioCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    assets: list[AssetInput] = Field(min_length=1, max_length=20)

    @field_validator('assets')
    @classmethod
    def weights_must_sum_to_one(cls, assets: list[AssetInput]) -> list[AssetInput]:
        total = sum(a.weight for a in assets)
        if abs(total - 1.0) > 0.001:
            raise ValueError(f'Weights must sum to 1.0, got {total:.4f}')
        return assets

# WRONG -- Pydantic v1 syntax, do not use
class Portfolio(BaseModel):
    @validator('assets')  # v1 syntax -- never use
    def check_weights(cls, v):
        ...
```

---

## ENVIRONMENT & CONFIG RULES

All configuration comes from core/config.py using Pydantic BaseSettings.
Never use os.environ.get() directly in services or routers -- always use settings.

```python
# core/config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str
    secret_key: str
    mistral_api_key: str
    allowed_origins: list[str] = ["http://localhost:3000"]

    model_config = {"env_file": ".env"}

settings = Settings()
```

---

## TESTING RULES

Every service function has a corresponding test file in /tests/.
Use pytest-asyncio for async tests.
Use pytest fixtures for DB sessions and test data.

```python
# tests/test_risk_engine.py
import numpy as np
import pytest
from app.services.risk_engine import calculate_var

def test_var_historical_95():
    returns = np.random.normal(-0.001, 0.02, 500)
    result = calculate_var(returns, confidence_level=0.95, method="historical")
    assert result.var < 0          # VaR is a loss, should be negative
    assert result.cvar <= result.var  # CVaR is always worse than VaR
    assert result.confidence_level == 0.95

def test_weights_validation():
    # weights summing to != 1.0 must raise
    ...
```

Minimum test coverage required:
- risk_engine.py: VaR historical, VaR parametric, CVaR, edge cases (all same returns)
- montecarlo_engine.py: output shape, mean trajectory near expected value
- markowitz_engine.py: frontier has correct number of points, weights sum to 1
- stress_engine.py: drawdown is negative, recovery_days is int or None

---

## LOGGING RULES

Use Python's standard logging module, not print().
Log level INFO for normal operations, WARNING for recoverable issues, ERROR for failures.
Never log: JWT tokens, API keys, full portfolio weights with user IDs, Mistral responses.

```python
import logging
logger = logging.getLogger(__name__)

logger.info("VaR calculation completed for portfolio %s (from_cache=%s)", portfolio_id, from_cache)
logger.warning("yfinance returned empty data for ticker %s", ticker)
logger.error("Mistral API call failed: %s", str(e))
```

---

## RULES SPECIFIC TO THIS LAYER

NEVER:
- Put calculation logic in routers
- Use sync SQLAlchemy (always async)
- Catch bare Exception without logging
- Access os.environ directly -- use settings
- Expose stack traces in error responses
- Log sensitive user data or API keys
- Use Pydantic v1 syntax (@validator)

ALWAYS:
- Inject get_current_user on every protected endpoint
- Check calculation cache before computing
- Validate tickers via market_data.validate_ticker()
- Validate portfolio weights sum to 1.0 in Pydantic schema
- Return typed Pydantic response models (not raw dicts)
- Write the test for every new service function