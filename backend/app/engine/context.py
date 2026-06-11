"""
Step Execution Context — variable store, interpolation, and extraction engine.

Manages the chain state between sequential steps: extracts values from responses
using JSONPath or regex, stores them as named variables, and interpolates
{{variable}} placeholders into subsequent request configurations.
"""

from __future__ import annotations

import json
import re
from copy import deepcopy
from typing import Any

from jsonpath_ng import parse as jsonpath_parse
from jsonpath_ng.exceptions import JsonPathParserError

from ..models.domain import ExtractionRule, ExtractionSource
from ..models.results import ExtractionLog


# Pattern matching {{variable_name}} placeholders
_INTERPOLATION_PATTERN = re.compile(r"\{\{(\w+)\}\}")


class StepContext:
    """
    Manages execution state across chained synthetic check steps.

    Responsibilities:
    - Store extracted variables from each step's response
    - Interpolate {{variable}} placeholders in request configs
    - Apply extraction rules (JSONPath for body, direct lookup for headers/status)
    - Provide a frozen snapshot of current variable state
    """

    def __init__(self, initial_variables: dict[str, Any] | None = None) -> None:
        """
        Initialize the context with optional seed variables.

        Args:
            initial_variables: Pre-populated variables (e.g., vault-leased credentials).
        """
        self._variables: dict[str, Any] = dict(initial_variables or {})

    @property
    def variables(self) -> dict[str, Any]:
        """Read-only view of current variables."""
        return dict(self._variables)

    def set_variable(self, name: str, value: Any) -> None:
        """Store a named variable in the context."""
        self._variables[name] = value

    def get_variable(self, name: str) -> Any | None:
        """Retrieve a variable by name, or None if not set."""
        return self._variables.get(name)

    def interpolate(self, template: str) -> str:
        """
        Replace all {{variable_name}} placeholders in a string with their
        current values from the context.

        Unresolved placeholders are left as-is to aid debugging.

        Args:
            template: String potentially containing {{variable}} placeholders.

        Returns:
            The interpolated string.
        """
        if not template:
            return template

        def _replacer(match: re.Match) -> str:
            var_name = match.group(1)
            value = self._variables.get(var_name)
            if value is None:
                # Leave unresolved placeholders intact for visibility
                return match.group(0)
            return str(value)

        return _INTERPOLATION_PATTERN.sub(_replacer, template)

    def interpolate_dict(self, data: dict[str, str]) -> dict[str, str]:
        """
        Interpolate all values in a string→string dictionary.

        Args:
            data: Dictionary with values potentially containing {{variable}} placeholders.

        Returns:
            New dictionary with interpolated values.
        """
        return {key: self.interpolate(value) for key, value in data.items()}

    def extract(
        self,
        response_body: Any,
        response_headers: dict[str, str],
        status_code: int,
        rules: list[ExtractionRule],
        step_index: int,
    ) -> list[ExtractionLog]:
        """
        Apply extraction rules against a step's response and store the results.

        Supports three extraction sources:
        - body: Uses JSONPath to query the response body (parsed as JSON)
        - header: Direct lookup by header name
        - status: Returns the HTTP status code

        Args:
            response_body: The response body (dict, list, or raw string).
            response_headers: Response headers as a dictionary.
            status_code: HTTP status code.
            rules: List of ExtractionRule definitions.
            step_index: Index of the step being processed.

        Returns:
            List of ExtractionLog entries documenting each extraction attempt.
        """
        logs: list[ExtractionLog] = []

        for rule in rules:
            log = ExtractionLog(
                variable_name=rule.variable_name,
                expression=rule.expression,
                source=rule.source.value,
                source_step_index=step_index,
            )

            try:
                if rule.source == ExtractionSource.STATUS:
                    extracted = status_code
                elif rule.source == ExtractionSource.HEADER:
                    extracted = response_headers.get(rule.expression)
                    if extracted is None:
                        # Try case-insensitive header lookup
                        lower_expr = rule.expression.lower()
                        for hdr_key, hdr_val in response_headers.items():
                            if hdr_key.lower() == lower_expr:
                                extracted = hdr_val
                                break
                elif rule.source == ExtractionSource.BODY:
                    extracted = self._extract_jsonpath(response_body, rule.expression)
                else:
                    extracted = None

                if extracted is not None:
                    self._variables[rule.variable_name] = extracted
                    log.extracted_value = extracted
                    log.success = True
                else:
                    log.success = False
                    log.error = f"No value found for expression: {rule.expression}"

            except Exception as exc:
                log.success = False
                log.error = str(exc)

            logs.append(log)

        return logs

    def _extract_jsonpath(self, body: Any, expression: str) -> Any | None:
        """
        Extract a value from a JSON body using a JSONPath expression.

        Args:
            body: Response body (will be parsed from string if needed).
            expression: JSONPath expression (e.g., "$.data.token").

        Returns:
            The first matched value, or None if no match.
        """
        # Parse body from string if necessary
        if isinstance(body, str):
            try:
                body = json.loads(body)
            except (json.JSONDecodeError, TypeError):
                return None

        if not isinstance(body, (dict, list)):
            return None

        try:
            parsed_expr = jsonpath_parse(expression)
            matches = parsed_expr.find(body)
            if matches:
                return matches[0].value
            return None
        except JsonPathParserError:
            return None

    def snapshot(self) -> dict[str, Any]:
        """
        Return a deep-frozen copy of the current variable state.

        Useful for capturing the context state at a point in time
        without allowing subsequent mutations to affect the snapshot.
        """
        return deepcopy(self._variables)
