"""
Synthetic Execution Engine — async HTTP step runner with chained context.

Executes a SyntheticCheck's steps sequentially, carrying extracted variables
forward through the chain. Each step's URL, headers, query params, and body
are interpolated with the current context before execution.
"""

from __future__ import annotations

import json
import time
from datetime import datetime, timezone
from typing import Any

import httpx

from ..models.domain import (
    Assertion,
    AssertionOperator,
    AssertionTarget,
    StepConfig,
    SyntheticCheck,
)
from ..models.results import (
    AssertionResult,
    CheckResult,
    StepResult,
)
from ..vault.base import BaseVaultProvider
from .context import StepContext


# Maximum response body size to store in telemetry (10 KB)
_MAX_BODY_SIZE = 10_240


class SyntheticExecutionEngine:
    """
    Core execution engine for synthetic API monitoring checks.

    Processes a SyntheticCheck's steps sequentially, using an httpx.AsyncClient
    for HTTP requests and a StepContext for variable chaining.
    """

    def __init__(
        self,
        vault: BaseVaultProvider,
        client: httpx.AsyncClient,
        abort_on_failure: bool = False,
    ) -> None:
        """
        Initialize the execution engine.

        Args:
            vault: Vault provider for secret retrieval.
            client: Shared httpx async client.
            abort_on_failure: If True, stop execution after the first step failure.
        """
        self._vault = vault
        self._client = client
        self._abort_on_failure = abort_on_failure

    async def execute_check(
        self,
        check: SyntheticCheck,
        initial_context: dict[str, Any] | None = None,
    ) -> CheckResult:
        """
        Execute all steps in a synthetic check sequentially.

        Args:
            check: The SyntheticCheck definition containing ordered steps.
            initial_context: Optional seed variables (e.g., vault-leased credentials).

        Returns:
            CheckResult with per-step telemetry, extraction logs, and assertion results.
        """
        ctx = StepContext(initial_variables=initial_context)
        step_results: list[StepResult] = []
        execution_start = datetime.now(timezone.utc)
        total_start = time.perf_counter()

        for idx, step in enumerate(check.steps):
            step_result = await self._execute_step(step, idx, ctx)
            step_results.append(step_result)

            if not step_result.passed and self._abort_on_failure:
                break

        total_duration = (time.perf_counter() - total_start) * 1000
        overall_passed = all(sr.passed for sr in step_results)

        return CheckResult(
            check_id=check.id,
            check_name=check.name,
            steps=step_results,
            overall_passed=overall_passed,
            total_duration_ms=round(total_duration, 2),
            executed_at=execution_start,
            context_snapshot=ctx.snapshot(),
        )

    async def _execute_step(
        self,
        step: StepConfig,
        step_index: int,
        ctx: StepContext,
    ) -> StepResult:
        """
        Execute a single step: interpolate, request, extract, assert.

        Args:
            step: The StepConfig to execute.
            step_index: Zero-based step index.
            ctx: The shared execution context.

        Returns:
            StepResult with full telemetry.
        """
        started_at = datetime.now(timezone.utc)
        start_time = time.perf_counter()

        # --- Phase 1: Interpolate all templated fields ---
        interpolated_url = ctx.interpolate(step.url)
        interpolated_headers = ctx.interpolate_dict(step.headers)
        interpolated_params = ctx.interpolate_dict(step.query_params)
        interpolated_body = ctx.interpolate(step.body) if step.body else None

        # --- Phase 2: Execute HTTP request ---
        status_code: int | None = None
        response_headers: dict[str, str] = {}
        response_body_text: str | None = None
        error: str | None = None

        try:
            response = await self._client.request(
                method=step.method.value,
                url=interpolated_url,
                headers=interpolated_headers,
                params=interpolated_params,
                content=interpolated_body.encode("utf-8") if interpolated_body else None,
            )
            status_code = response.status_code
            response_headers = dict(response.headers)
            raw_body = response.text
            # Truncate large bodies for telemetry
            response_body_text = raw_body[:_MAX_BODY_SIZE] if raw_body else None

        except httpx.TimeoutException:
            error = "Request timed out"
        except httpx.ConnectError as exc:
            error = f"Connection error: {exc}"
        except httpx.RequestError as exc:
            error = f"Request failed: {exc}"
        except Exception as exc:
            error = f"Unexpected error: {type(exc).__name__}: {exc}"

        latency_ms = round((time.perf_counter() - start_time) * 1000, 2)
        completed_at = datetime.now(timezone.utc)

        # --- Phase 3: Extract variables (only if request succeeded) ---
        extraction_logs = []
        if error is None and status_code is not None:
            # Try to parse body as JSON for extraction
            body_for_extraction: Any = raw_body
            if raw_body:
                try:
                    body_for_extraction = json.loads(raw_body)
                except (json.JSONDecodeError, TypeError):
                    body_for_extraction = raw_body

            extraction_logs = ctx.extract(
                response_body=body_for_extraction,
                response_headers=response_headers,
                status_code=status_code,
                rules=step.extraction_rules,
                step_index=step_index,
            )

        # --- Phase 4: Evaluate assertions ---
        assertion_results = []
        if error is None and status_code is not None:
            body_for_assertion: Any = raw_body
            if raw_body:
                try:
                    body_for_assertion = json.loads(raw_body)
                except (json.JSONDecodeError, TypeError):
                    body_for_assertion = raw_body

            for assertion in step.assertions:
                result = self._evaluate_assertion(
                    assertion=assertion,
                    status_code=status_code,
                    response_headers=response_headers,
                    response_body=body_for_assertion,
                )
                assertion_results.append(result)

        # Determine pass/fail
        all_assertions_passed = all(ar.passed for ar in assertion_results)
        step_passed = error is None and all_assertions_passed

        return StepResult(
            step_index=step_index,
            step_name=step.name,
            url=interpolated_url,
            method=step.method,
            request_headers=interpolated_headers,
            request_body=interpolated_body,
            status_code=status_code,
            response_headers=response_headers,
            response_body=response_body_text,
            latency_ms=latency_ms,
            extractions=extraction_logs,
            assertions=assertion_results,
            passed=step_passed,
            error=error,
            started_at=started_at,
            completed_at=completed_at,
        )

    def _evaluate_assertion(
        self,
        assertion: Assertion,
        status_code: int,
        response_headers: dict[str, str],
        response_body: Any,
    ) -> AssertionResult:
        """
        Evaluate a single assertion against the response.

        Args:
            assertion: The assertion definition.
            status_code: HTTP status code.
            response_headers: Response headers.
            response_body: Parsed response body.

        Returns:
            AssertionResult with pass/fail status and diagnostic message.
        """
        actual_value: str | None = None

        try:
            # Determine the actual value based on assertion target
            if assertion.target == AssertionTarget.STATUS_CODE:
                actual_value = str(status_code)
            elif assertion.target == AssertionTarget.HEADER:
                if not assertion.header_name:
                    return AssertionResult(
                        assertion=assertion,
                        actual_value=None,
                        passed=False,
                        message="Header name is required for header assertions",
                    )
                header_name = assertion.header_name
                actual_value = response_headers.get(header_name)
                if actual_value is None:
                    # Case-insensitive fallback
                    lower_name = header_name.lower()
                    for k, v in response_headers.items():
                        if k.lower() == lower_name:
                            actual_value = v
                            break
            elif assertion.target == AssertionTarget.BODY:
                if isinstance(response_body, (dict, list)):
                    actual_value = json.dumps(response_body)
                else:
                    actual_value = str(response_body) if response_body else None

            # Evaluate the comparison
            passed = self._compare(actual_value, assertion.operator, assertion.expected)

            message = (
                f"{'PASS' if passed else 'FAIL'}: "
                f"{assertion.target.value} {assertion.operator.value} "
                f"'{assertion.expected}' "
                f"(actual: '{actual_value}')"
            )

            return AssertionResult(
                assertion=assertion,
                actual_value=actual_value,
                passed=passed,
                message=message,
            )

        except Exception as exc:
            return AssertionResult(
                assertion=assertion,
                actual_value=actual_value,
                passed=False,
                message=f"Assertion evaluation error: {exc}",
            )

    @staticmethod
    def _compare(actual: str | None, operator: AssertionOperator, expected: str) -> bool:
        """
        Perform a comparison between actual and expected values.

        Args:
            actual: The actual value from the response.
            operator: The comparison operator.
            expected: The expected value.

        Returns:
            True if the comparison succeeds.
        """
        if actual is None:
            return operator == AssertionOperator.NEQ

        if operator == AssertionOperator.EQ:
            return actual == expected
        elif operator == AssertionOperator.NEQ:
            return actual != expected
        elif operator == AssertionOperator.CONTAINS:
            return expected in actual
        elif operator == AssertionOperator.MATCHES:
            import re
            try:
                return bool(re.search(expected, actual))
            except re.error:
                return False
        elif operator == AssertionOperator.GT:
            try:
                return float(actual) > float(expected)
            except (ValueError, TypeError):
                return False
        elif operator == AssertionOperator.LT:
            try:
                return float(actual) < float(expected)
            except (ValueError, TypeError):
                return False

        return False
