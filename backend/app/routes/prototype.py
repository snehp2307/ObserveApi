"""
Prototype API routes for the synthetic monitoring platform.

Provides the test-run endpoint that receives check composition JSON from the UI,
binds mock vault secrets, runs the execution engine, and returns structured results.
"""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field

from ..models.domain import SyntheticCheck
from ..models.results import CheckResult
from ..engine.executor import SyntheticExecutionEngine
from ..vault.mock import MockVaultProvider

router = APIRouter(prefix="/api/v1/prototype", tags=["prototype"])


class TestRunRequest(BaseModel):
    """Request payload for executing a synthetic check test run."""

    check: SyntheticCheck = Field(
        ..., description="The synthetic check definition to execute"
    )
    secrets_config: dict[str, Any] | None = Field(
        default=None,
        description="Optional vault configuration for credential leasing. "
        "Keys: 'secret_path' (str), 'role' (str), 'ttl' (int)",
    )
    abort_on_failure: bool = Field(
        default=False,
        description="If true, stop execution after the first step failure",
    )


class TestRunResponse(BaseModel):
    """Wrapper response for test run results."""

    success: bool = Field(..., description="Whether the API call itself succeeded")
    result: CheckResult = Field(..., description="The complete check execution result")


@router.post(
    "/test-run",
    response_model=TestRunResponse,
    summary="Execute a Synthetic Check Test Run",
    description=(
        "Receives a SyntheticCheck composition from the UI, binds mock vault secrets, "
        "executes the check through the async engine, and returns structured results "
        "including per-step latency, extraction logs, and assertion outcomes."
    ),
)
async def execute_test_run(
    request: Request,
    payload: TestRunRequest,
) -> TestRunResponse:
    """
    Execute a synthetic check test run.

    1. Instantiate MockVaultProvider
    2. Optionally lease credentials based on secrets_config
    3. Run SyntheticExecutionEngine.execute_check()
    4. Return structured CheckResult
    """
    # Retrieve the shared httpx client from app state
    client = request.app.state.http_client

    # Initialize mock vault
    vault = MockVaultProvider()

    # Build initial context with vault-leased credentials if configured
    initial_context: dict[str, Any] = {}

    if payload.secrets_config:
        try:
            leased = await vault.lease_credential(payload.secrets_config)
            # Inject leased credentials into the execution context
            initial_context.update(leased)
        except Exception as exc:
            raise HTTPException(
                status_code=500,
                detail=f"Vault credential leasing failed: {exc}",
            )

    # Execute the check
    engine = SyntheticExecutionEngine(
        vault=vault,
        client=client,
        abort_on_failure=payload.abort_on_failure,
    )

    try:
        result = await engine.execute_check(
            check=payload.check,
            initial_context=initial_context if initial_context else None,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Check execution failed: {type(exc).__name__}: {exc}",
        )

    return TestRunResponse(success=True, result=result)


@router.get(
    "/health",
    summary="Health Check",
    description="Simple health check endpoint for the prototype API.",
)
async def health_check() -> dict[str, str]:
    """Return a simple health status."""
    return {"status": "healthy", "service": "observe-api-prototype"}
