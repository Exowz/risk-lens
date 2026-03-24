"""
FastAPI application entry point.

Configures CORS, registers exception handlers, and includes all routers.
Uses lifespan for startup/shutdown events.
"""

import logging
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.exceptions import register_exception_handlers

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)-8s [%(name)s] %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan: startup and shutdown events."""
    logger.info("RiskLens API starting up")
    yield
    logger.info("RiskLens API shutting down")


app = FastAPI(
    title="RiskLens API",
    description="Financial portfolio risk management platform",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS configuration from settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register custom exception handlers
register_exception_handlers(app)

# Register routers
from app.api.v1.alerts import router as alerts_router
from app.api.v1.markowitz import router as markowitz_router
from app.api.v1.portfolios import router as portfolios_router
from app.api.v1.profile import router as profile_router
from app.api.v1.report import router as report_router
from app.api.v1.risk import router as risk_router
from app.api.v1.stress import router as stress_router

app.include_router(portfolios_router, prefix="/api/v1")
app.include_router(risk_router, prefix="/api/v1")
app.include_router(markowitz_router, prefix="/api/v1")
app.include_router(stress_router, prefix="/api/v1")
app.include_router(report_router, prefix="/api/v1")
app.include_router(profile_router, prefix="/api/v1")
app.include_router(alerts_router, prefix="/api/v1")


# Health check
@app.get("/health")
async def health() -> dict[str, str]:
    """Health check endpoint."""
    return {"status": "ok"}
