"""
Pydantic v2 schemas for narrative report endpoint.

Depends on: pydantic
Used by: api/v1/report.py
"""

from datetime import datetime

from pydantic import BaseModel, Field


class ReportRequest(BaseModel):
    """Request body for report generation."""

    portfolio_id: str = Field(description="Portfolio UUID")


class ReportResponse(BaseModel):
    """Generated narrative report."""

    report_id: str = Field(description="Report UUID")
    content: str = Field(description="Narrative report text (markdown)")
    generated_at: datetime = Field(description="Generation timestamp")
    from_cache: bool = False


class ReportHistoryItem(BaseModel):
    """Summary of a previously generated report."""

    report_id: str
    portfolio_id: str
    portfolio_name: str
    generated_at: datetime
