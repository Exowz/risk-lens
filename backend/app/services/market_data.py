"""
Market data service using yfinance.

Validates tickers, fetches historical OHLCV data, and computes daily returns.
Uses TTL-based in-memory cache (1 hour) to avoid redundant API calls.

Depends on: yfinance, numpy, pandas
Used by: api/v1/portfolios.py, risk_engine, markowitz_engine, stress_engine
"""

import logging
import time
from typing import TypedDict

import numpy as np
import pandas as pd
import yfinance as yf

from app.core.exceptions import TickerNotFoundError

logger = logging.getLogger(__name__)

# In-memory cache: key -> (data, timestamp)
_price_cache: dict[str, tuple[pd.DataFrame, float]] = {}
_CACHE_TTL_SECONDS = 3600  # 1 hour

# Separate cache for live quotes (shorter TTL)
_quote_cache: dict[str, tuple[dict[str, object], float]] = {}
_QUOTE_CACHE_TTL = 300  # 5 minutes


class TickerValidationResult(TypedDict):
    """Result of ticker validation."""

    valid: bool
    ticker: str
    name: str | None


def _cache_key(ticker: str, period: str) -> str:
    """Build cache key for price data."""
    return f"{ticker}:{period}"


def _get_cached(key: str) -> pd.DataFrame | None:
    """Return cached data if still valid, else None."""
    if key in _price_cache:
        data, ts = _price_cache[key]
        if time.time() - ts < _CACHE_TTL_SECONDS:
            return data
        del _price_cache[key]
    return None


def _set_cache(key: str, data: pd.DataFrame) -> None:
    """Store data in cache with current timestamp."""
    _price_cache[key] = (data, time.time())


async def validate_ticker(ticker: str) -> TickerValidationResult:
    """
    Validate that a ticker symbol exists on yfinance.

    Args:
        ticker: Uppercase ticker symbol (e.g., "AAPL")

    Returns:
        TickerValidationResult with valid=True if ticker exists

    Raises:
        TickerNotFoundError: If the ticker is not found on yfinance
    """
    try:
        info = yf.Ticker(ticker)
        # Try to get a basic attribute to verify ticker exists
        hist = info.history(period="5d")
        if hist.empty:
            raise TickerNotFoundError(ticker)
        name = info.info.get("shortName") or info.info.get("longName")
        return TickerValidationResult(valid=True, ticker=ticker, name=name)
    except TickerNotFoundError:
        raise
    except Exception as e:
        logger.warning("Ticker validation failed for %s: %s", ticker, str(e))
        raise TickerNotFoundError(ticker) from e


async def get_historical_prices(
    tickers: list[str],
    period: str = "2y",
) -> pd.DataFrame:
    """
    Fetch historical adjusted close prices for a list of tickers.

    Args:
        tickers: List of ticker symbols
        period: yfinance period string (e.g., "1y", "2y", "5y")

    Returns:
        DataFrame with tickers as columns and dates as index (adjusted close)

    Raises:
        TickerNotFoundError: If any ticker returns empty data
    """
    frames: dict[str, pd.Series] = {}

    for ticker in tickers:
        key = _cache_key(ticker, period)
        cached = _get_cached(key)

        if cached is not None:
            frames[ticker] = cached["Close"]
            logger.info("Cache hit for %s (period=%s)", ticker, period)
            continue

        logger.info("Fetching price data for %s (period=%s)", ticker, period)
        data = yf.Ticker(ticker).history(period=period)

        if data.empty:
            raise TickerNotFoundError(ticker)

        _set_cache(key, data)
        frames[ticker] = data["Close"]

    # Align all series on a common date index
    prices = pd.DataFrame(frames)
    prices = prices.dropna()

    if prices.empty:
        raise TickerNotFoundError(
            tickers[0] if len(tickers) == 1 else f"[{', '.join(tickers)}]"
        )

    return prices


async def get_daily_returns(
    tickers: list[str],
    period: str = "2y",
) -> dict[str, np.ndarray]:
    """
    Fetch and return daily log returns for a list of tickers.

    Args:
        tickers: List of ticker symbols
        period: yfinance period string

    Returns:
        Dictionary mapping ticker -> numpy array of daily log returns

    Raises:
        TickerNotFoundError: If any ticker is invalid
    """
    prices = await get_historical_prices(tickers, period)

    returns: dict[str, np.ndarray] = {}
    for ticker in tickers:
        if ticker in prices.columns:
            series = prices[ticker]
            log_returns = np.log(series / series.shift(1)).dropna()
            returns[ticker] = log_returns.to_numpy()

    return returns


async def get_portfolio_returns(
    tickers: list[str],
    weights: list[float],
    period: str = "2y",
) -> np.ndarray:
    """
    Compute weighted portfolio daily returns.

    Args:
        tickers: List of ticker symbols
        weights: Corresponding weights (must sum to ~1.0)
        period: yfinance period string

    Returns:
        numpy array of daily portfolio returns
    """
    prices = await get_historical_prices(tickers, period)

    # Compute simple daily returns
    daily_returns = prices.pct_change().dropna()

    # Weighted portfolio return
    weights_array = np.array(weights)
    portfolio_returns: np.ndarray = daily_returns.to_numpy() @ weights_array

    return portfolio_returns


async def get_normalized_prices(
    tickers: list[str],
    period: str = "2y",
) -> dict[str, list[dict[str, float | str]]]:
    """
    Get normalized price series (base 100) for charting.

    Args:
        tickers: List of ticker symbols
        period: yfinance period string

    Returns:
        Dictionary mapping ticker -> list of {date, value} points
    """
    prices = await get_historical_prices(tickers, period)

    result: dict[str, list[dict[str, float | str]]] = {}

    for ticker in prices.columns:
        series = prices[ticker]
        normalized = (series / series.iloc[0]) * 100
        result[ticker] = [
            {"date": str(date.date()), "value": round(float(val), 2)}
            for date, val in normalized.items()
        ]

    return result


async def get_live_quotes(tickers: list[str]) -> list[dict[str, object]]:
    """
    Get current price and daily change % for a list of tickers.

    Uses yfinance fast_info/info with a 5-minute in-memory cache.

    Args:
        tickers: List of ticker symbols

    Returns:
        List of {ticker, price, change_pct, currency} dicts
    """
    quotes: list[dict[str, object]] = []

    for ticker in tickers:
        now = time.time()

        # Check cache
        if ticker in _quote_cache:
            cached_quote, cached_ts = _quote_cache[ticker]
            if now - cached_ts < _QUOTE_CACHE_TTL:
                quotes.append(cached_quote)
                continue

        try:
            info = yf.Ticker(ticker)
            fast = info.fast_info
            price = float(fast.last_price)
            prev_close = float(fast.previous_close)
            change_pct = ((price - prev_close) / prev_close) * 100 if prev_close else 0.0
            currency = str(getattr(fast, "currency", "USD"))

            quote: dict[str, object] = {
                "ticker": ticker,
                "price": round(price, 2),
                "change_pct": round(change_pct, 2),
                "currency": currency,
            }
        except Exception as e:
            logger.warning("Failed to get live quote for %s: %s", ticker, str(e))
            quote = {
                "ticker": ticker,
                "price": None,
                "change_pct": None,
                "currency": "USD",
            }

        _quote_cache[ticker] = (quote, now)
        quotes.append(quote)

    return quotes
