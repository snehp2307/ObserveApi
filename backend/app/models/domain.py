"""
Domain models for the Unified Synthetic API Monitoring Platform.

Hierarchy: BusinessService -> BusinessProcess -> SyntheticCheck -> StepConfig
Each StepConfig defines a single HTTP request with extraction rules and assertions.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


class HttpMethod(str, Enum):
    """Supported HTTP methods for synthetic checks."""

    GET = "GET"
    POST = "POST"
    PUT = "PUT"
    DELETE = "DELETE"
    PATCH = "PATCH"


class ExtractionSource(str, Enum):
    """Where to extract a variable from in the HTTP response."""

    BODY = "body"
    HEADER = "header"
    STATUS = "status"


class AssertionTarget(str, Enum):
    """What part of the response to assert against."""

    STATUS_CODE = "status_code"
    HEADER = "header"
    BODY = "body"


class AssertionOperator(str, Enum):
    """Comparison operators for assertions."""

    EQ = "eq"
    NEQ = "neq"
    CONTAINS = "contains"
    MATCHES = "matches"
    GT = "gt"
    LT = "lt"


class ExtractionRule(BaseModel):
    """
    Defines how to extract a variable from a step's response.

    Example:
        variable_name: "auth_token"
        source: "body"
        expression: "$.data.access_token"
    """

    variable_name: str = Field(
        ..., description="Name of the variable to store the extracted value as"
    )
    source: ExtractionSource = Field(
        default=ExtractionSource.BODY,
        description="Part of the response to extract from",
    )
    expression: str = Field(
        ...,
        description="JSONPath expression (for body) or header name (for header) or literal 'code' (for status)",
    )


class Assertion(BaseModel):
    """
    Defines a validation rule to evaluate against a step's response.

    Example:
        target: "status_code"
        operator: "eq"
        expected: "200"
    """

    target: AssertionTarget = Field(
        ..., description="Part of the response to assert against"
    )
    operator: AssertionOperator = Field(
        ..., description="Comparison operator"
    )
    expected: str = Field(
        ..., description="Expected value (string representation)"
    )
    header_name: str | None = Field(
        default=None,
        description="Header name when target is 'header'",
    )


class StepConfig(BaseModel):
    """
    Configuration for a single HTTP request step within a synthetic check.

    Supports variable interpolation via {{variable_name}} syntax in url,
    headers, query_params, and body fields.
    """

    name: str = Field(
        default="Untitled Step", description="Human-readable step name"
    )
    url: str = Field(
        ..., description="Target URL (supports {{variable}} interpolation)"
    )
    method: HttpMethod = Field(
        default=HttpMethod.GET, description="HTTP method"
    )
    headers: dict[str, str] = Field(
        default_factory=dict,
        description="Request headers (values support {{variable}} interpolation)",
    )
    query_params: dict[str, str] = Field(
        default_factory=dict,
        description="Query parameters (values support {{variable}} interpolation)",
    )
    body: str | None = Field(
        default=None,
        description="Request body (JSON string, supports {{variable}} interpolation)",
    )
    extraction_rules: list[ExtractionRule] = Field(
        default_factory=list,
        description="Rules for extracting variables from this step's response",
    )
    assertions: list[Assertion] = Field(
        default_factory=list,
        description="Assertions to validate this step's response",
    )


class SyntheticCheck(BaseModel):
    """
    A named sequence of HTTP steps that form a complete synthetic test scenario.
    Steps execute sequentially with chained variable context.
    """

    id: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        description="Unique check identifier",
    )
    name: str = Field(
        default="Untitled Check", description="Human-readable check name"
    )
    steps: list[StepConfig] = Field(
        default_factory=list,
        description="Ordered list of HTTP steps to execute",
    )
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="Creation timestamp",
    )


class BusinessProcess(BaseModel):
    """
    A business process groups related synthetic checks.
    Example: "User Authentication Flow" containing login, token-refresh, and logout checks.
    """

    id: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        description="Unique process identifier",
    )
    name: str = Field(
        default="Untitled Process",
        description="Human-readable process name",
    )
    checks: list[SyntheticCheck] = Field(
        default_factory=list,
        description="Synthetic checks belonging to this process",
    )


class BusinessService(BaseModel):
    """
    Top-level domain model representing a business service.
    A service contains one or more business processes.
    Example: "Identity Platform" containing "Auth Flow" and "User Management" processes.
    """

    id: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        description="Unique service identifier",
    )
    name: str = Field(
        default="Untitled Service",
        description="Human-readable service name",
    )
    processes: list[BusinessProcess] = Field(
        default_factory=list,
        description="Business processes belonging to this service",
    )
