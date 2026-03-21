"""
Portfolio CRUD router.

Endpoints:
    GET    /portfolios          -- List all portfolios for current user
    POST   /portfolios          -- Create a new portfolio (validates tickers + weights)
    GET    /portfolios/{id}     -- Get a single portfolio with assets
    DELETE /portfolios/{id}     -- Delete a portfolio

Depends on: schemas/portfolio.py, models/portfolio.py, core/security.py, services/market_data.py
Used by: Frontend TanStack Query hooks
"""

import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.portfolio import Asset, Portfolio
from app.models.user import User
from app.schemas.portfolio import (
    PortfolioCreateRequest,
    PortfolioListResponse,
    PortfolioResponse,
)
from app.services.market_data import get_normalized_prices, validate_ticker

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/portfolios", tags=["portfolios"])


@router.get("", response_model=list[PortfolioListResponse])
async def list_portfolios(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[PortfolioListResponse]:
    """List all portfolios for the authenticated user."""
    result = await db.execute(
        select(Portfolio)
        .where(Portfolio.user_id == current_user.id)
        .options(selectinload(Portfolio.assets))
        .order_by(Portfolio.updated_at.desc())
    )
    portfolios = result.scalars().all()

    return [
        PortfolioListResponse(
            id=p.id,
            name=p.name,
            asset_count=len(p.assets),
            created_at=p.created_at,
            updated_at=p.updated_at,
        )
        for p in portfolios
    ]


@router.post("", response_model=PortfolioResponse, status_code=status.HTTP_201_CREATED)
async def create_portfolio(
    request: PortfolioCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> PortfolioResponse:
    """
    Create a new portfolio.

    Validates all ticker symbols against yfinance before creating.
    Validates that weights sum to 1.0 (±0.001) via Pydantic schema.
    """
    # Validate all tickers exist on yfinance
    for asset_input in request.assets:
        await validate_ticker(asset_input.ticker)

    # Create portfolio with assets
    portfolio = Portfolio(
        user_id=current_user.id,
        name=request.name,
    )
    db.add(portfolio)
    await db.flush()  # Get the portfolio ID

    for asset_input in request.assets:
        asset = Asset(
            portfolio_id=portfolio.id,
            ticker=asset_input.ticker,
            weight=asset_input.weight,
        )
        db.add(asset)

    await db.flush()

    # Reload with assets for response
    result = await db.execute(
        select(Portfolio)
        .where(Portfolio.id == portfolio.id)
        .options(selectinload(Portfolio.assets))
    )
    created = result.scalar_one()

    logger.info(
        "Portfolio created: id=%s name=%s assets=%d user=%s",
        created.id,
        created.name,
        len(created.assets),
        current_user.id,
    )

    return PortfolioResponse.model_validate(created)


@router.get("/{portfolio_id}", response_model=PortfolioResponse)
async def get_portfolio(
    portfolio_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> PortfolioResponse:
    """Get a single portfolio by ID. Only accessible by the owning user."""
    result = await db.execute(
        select(Portfolio)
        .where(
            Portfolio.id == portfolio_id,
            Portfolio.user_id == current_user.id,
        )
        .options(selectinload(Portfolio.assets))
    )
    portfolio = result.scalar_one_or_none()

    if portfolio is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Portfolio '{portfolio_id}' not found",
        )

    return PortfolioResponse.model_validate(portfolio)


@router.delete("/{portfolio_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_portfolio(
    portfolio_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    """Delete a portfolio. Only accessible by the owning user."""
    result = await db.execute(
        select(Portfolio).where(
            Portfolio.id == portfolio_id,
            Portfolio.user_id == current_user.id,
        )
    )
    portfolio = result.scalar_one_or_none()

    if portfolio is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Portfolio '{portfolio_id}' not found",
        )

    await db.delete(portfolio)

    logger.info(
        "Portfolio deleted: id=%s user=%s",
        portfolio_id,
        current_user.id,
    )


@router.get("/{portfolio_id}/prices")
async def get_portfolio_prices(
    portfolio_id: str,
    period: str = "2y",
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, list[dict[str, float | str]]]:
    """
    Get normalized historical prices (base 100) for all assets in a portfolio.

    Used by the frontend performance chart.
    """
    result = await db.execute(
        select(Portfolio)
        .where(
            Portfolio.id == portfolio_id,
            Portfolio.user_id == current_user.id,
        )
        .options(selectinload(Portfolio.assets))
    )
    portfolio = result.scalar_one_or_none()

    if portfolio is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Portfolio '{portfolio_id}' not found",
        )

    tickers = [asset.ticker for asset in portfolio.assets]
    return await get_normalized_prices(tickers, period=period)
