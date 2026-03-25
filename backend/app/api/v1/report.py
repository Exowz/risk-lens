"""
Report generation router.

Endpoints:
    POST /report/generate   -- Generate a narrative report via Mistral AI

Collects all risk metrics (VaR, Monte Carlo, Markowitz, stress tests),
sends to Mistral for narrative generation, saves to reports table.
PDF export is handled client-side via jspdf + html2canvas.

Depends on: schemas/report.py, models/report.py, services/mistral_service.py,
            services/risk_engine.py, services/montecarlo_engine.py,
            services/markowitz_engine.py, services/stress_engine.py,
            services/market_data.py
Used by: Frontend TanStack Query hooks
"""

import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.portfolio import Portfolio
from app.models.report import Report
from app.models.user import User
from app.schemas.report import ReportHistoryItem, ReportRequest, ReportResponse
from app.services.market_data import get_historical_prices, get_portfolio_returns
from app.services.markowitz_engine import compute_efficient_frontier
from app.services.mistral_service import generate_report
from app.services.montecarlo_engine import run_monte_carlo
from app.services.risk_engine import get_risk_summary
from app.services.stress_engine import run_stress_test

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/report", tags=["report"])


async def _load_portfolio(
    portfolio_id: str,
    user_id: str,
    db: AsyncSession,
) -> Portfolio:
    """Load a portfolio with assets, raise 404 if not found."""
    result = await db.execute(
        select(Portfolio)
        .where(Portfolio.id == portfolio_id, Portfolio.user_id == user_id)
        .options(selectinload(Portfolio.assets))
    )
    portfolio = result.scalar_one_or_none()

    if portfolio is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Portfolio '{portfolio_id}' not found",
        )
    return portfolio


@router.post("/generate", response_model=ReportResponse)
async def generate_narrative_report(
    request: ReportRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ReportResponse:
    """Generate a narrative risk report for a portfolio using Mistral AI."""
    portfolio = await _load_portfolio(request.portfolio_id, current_user.id, db)

    if len(portfolio.assets) < 2:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Report generation requires at least 2 assets",
        )

    tickers = [a.ticker for a in portfolio.assets]
    weights = [a.weight for a in portfolio.assets]
    current_weights = {a.ticker: a.weight for a in portfolio.assets}
    assets_list = [{"ticker": a.ticker, "weight": a.weight} for a in portfolio.assets]

    # ── Gather all metrics ──
    logger.info("Collecting metrics for report: portfolio=%s", portfolio.id)

    # Risk summary
    portfolio_returns = await get_portfolio_returns(tickers, weights, "2y")
    risk_summary_result = get_risk_summary(portfolio_returns, "2y")
    risk_summary = risk_summary_result.model_dump(exclude={"from_cache"})

    # Monte Carlo
    montecarlo_result = run_monte_carlo(portfolio_returns, n_simulations=10_000, n_days=252)
    montecarlo = montecarlo_result.model_dump(
        exclude={"from_cache", "sample_paths", "final_values"}
    )

    # Markowitz
    prices_2y = await get_historical_prices(tickers, "2y")
    markowitz_result = compute_efficient_frontier(prices_2y, current_weights, n_points=50)
    markowitz = markowitz_result.model_dump(
        exclude={"from_cache", "frontier_points"}
    )

    # Stress tests
    prices_max = await get_historical_prices(tickers, "max")
    stress_result = run_stress_test(prices_max, current_weights)
    stress = stress_result.model_dump(exclude={"from_cache"})

    # ── Call Mistral ──
    try:
        narrative = await generate_report(
            portfolio_name=portfolio.name,
            assets=assets_list,
            risk_summary=risk_summary,
            montecarlo=montecarlo,
            markowitz=markowitz,
            stress=stress,
            locale=request.locale,
        )
    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(e),
        ) from e

    # ── Save report ──
    report = Report(
        user_id=current_user.id,
        portfolio_id=portfolio.id,
        content=narrative,
    )
    db.add(report)
    await db.flush()
    await db.refresh(report)

    logger.info("Report generated and saved: report_id=%s", report.id)

    return ReportResponse(
        report_id=report.id,
        content=report.content,
        generated_at=report.generated_at,
    )


@router.get("/history", response_model=list[ReportHistoryItem])
async def get_report_history(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[ReportHistoryItem]:
    """Get all generated reports for the current user."""
    result = await db.execute(
        select(Report)
        .where(Report.user_id == current_user.id)
        .options(selectinload(Report.portfolio))
        .order_by(Report.generated_at.desc())
        .limit(50)
    )
    reports = result.scalars().all()
    return [
        ReportHistoryItem(
            report_id=r.id,
            portfolio_id=r.portfolio_id,
            portfolio_name=r.portfolio.name if r.portfolio else "—",
            generated_at=r.generated_at,
        )
        for r in reports
    ]
