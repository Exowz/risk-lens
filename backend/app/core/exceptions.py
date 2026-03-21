"""
Custom exception handlers for the FastAPI application.

Registered in main.py to provide consistent error responses.
Never exposes internal error details (stack traces, SQL errors) in responses.
"""

import logging

from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from pydantic import ValidationError

logger = logging.getLogger(__name__)


class RiskLensError(Exception):
    """Base exception for RiskLens application errors."""

    def __init__(self, detail: str, status_code: int = 400) -> None:
        self.detail = detail
        self.status_code = status_code
        super().__init__(detail)


class TickerNotFoundError(RiskLensError):
    """Raised when a ticker symbol is not found on yfinance."""

    def __init__(self, ticker: str) -> None:
        super().__init__(
            detail=f"Ticker '{ticker}' not found on yfinance",
            status_code=422,
        )


class PortfolioWeightsError(RiskLensError):
    """Raised when portfolio weights don't sum to 1.0."""

    def __init__(self, total: float) -> None:
        super().__init__(
            detail=f"Portfolio weights must sum to 1.0, got {total:.4f}",
            status_code=422,
        )


class RateLimitExceededError(RiskLensError):
    """Raised when a user exceeds the rate limit."""

    def __init__(self) -> None:
        super().__init__(
            detail="Rate limit exceeded. Max 10 requests/minute on calculation endpoints.",
            status_code=429,
        )


def register_exception_handlers(app: FastAPI) -> None:
    """Register all custom exception handlers on the FastAPI app."""

    @app.exception_handler(RiskLensError)
    async def risklens_error_handler(
        request: Request, exc: RiskLensError
    ) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail},
        )

    @app.exception_handler(ValidationError)
    async def validation_error_handler(
        request: Request, exc: ValidationError
    ) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={"detail": "Validation error", "errors": exc.errors()},
        )

    @app.exception_handler(Exception)
    async def unhandled_error_handler(
        request: Request, exc: Exception
    ) -> JSONResponse:
        logger.error("Unhandled exception: %s", str(exc), exc_info=True)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": "Internal server error"},
        )
