"""
Result models for synthetic check execution.

These models capture the full execution telemetry: per-step latency,
extraction logs, assertion outcomes, and aggregate check status.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from pydantic import BaseModel, Field

from .domain import Assertion, HttpMethod


class ExtractionLog(BaseModel):
    """Record of a single variable extraction from a step response."""

    variable_name: str = Field(..., description="Name of the extracted variable")
    expression: str = Field(..., description="Expression used for extraction")
    extracted_value: Any = Field(
        default=None, description="The value that was extracted (None if extraction failed)"
    )
    source: str = Field(..., description="Source of extraction: body, header, or status")
    source_step_index: int = Field(
        ..., description="Index of the step this extraction was performed on"
    )
    success: bool = Field(default=True, description="Whether the extraction succeeded")
    error: str | None = Field(default=None, description="Error message if extraction failed")


class AssertionResult(BaseModel):
    """Result of evaluating a single assertion against a step response."""

    assertion: Assertion = Field(..., description="The assertion configuration that was evaluated")
    actual_value: str | None = Field(
        default=None, description="The actual value found in the response"
    )
    passed: bool = Field(..., description="Whether the assertion passed")
    message: str = Field(
        default="", description="Human-readable description of the assertion outcome"
    )


class StepResult(BaseModel):
    """Complete execution result for a single step in a synthetic check."""

    step_index: int = Field(..., description="Zero-based index of the step")
    step_name: str = Field(default="", description="Name of the step")
    url: str = Field(..., description="The fully interpolated URL that was called")
    method: HttpMethod = Field(..., description="HTTP method used")
    request_headers: dict[str, str] = Field(
        default_factory=dict, description="Headers sent with the request (interpolated)"
    )
    request_body: str | None = Field(
        default=None, description="Body sent with the request (interpolated)"
    )
    status_code: int | None = Field(
        default=None, description="HTTP status code of the response (None if request failed)"
    )
    response_headers: dict[str, str] = Field(
        default_factory=dict, description="Response headers received"
    )
    response_body: str | None = Field(
        default=None,
        description="Response body (truncated to 10KB for telemetry)",
    )
    latency_ms: float = Field(
        default=0.0, description="Request round-trip time in milliseconds"
    )
    extractions: list[ExtractionLog] = Field(
        default_factory=list, description="Variable extraction results"
    )
    assertions: list[AssertionResult] = Field(
        default_factory=list, description="Assertion evaluation results"
    )
    passed: bool = Field(
        default=False,
        description="True if all assertions passed and no errors occurred",
    )
    error: str | None = Field(
        default=None,
        description="Error message if the step failed (network error, timeout, etc.)",
    )
    started_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="Timestamp when step execution began",
    )
    completed_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="Timestamp when step execution completed",
    )


class CheckResult(BaseModel):
    """Aggregate result of executing a complete synthetic check (all steps)."""

    check_id: str = Field(..., description="ID of the synthetic check that was executed")
    check_name: str = Field(default="", description="Name of the check")
    steps: list[StepResult] = Field(
        default_factory=list, description="Ordered results for each step"
    )
    overall_passed: bool = Field(
        default=False, description="True only if every step passed"
    )
    total_duration_ms: float = Field(
        default=0.0, description="Total execution time across all steps"
    )
    executed_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="Timestamp when the check execution started",
    )
    context_snapshot: dict[str, Any] = Field(
        default_factory=dict,
        description="Final state of all extracted variables after execution",
    )
