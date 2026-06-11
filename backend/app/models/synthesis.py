from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field

from .domain import SyntheticCheck


class SynthesisRequest(BaseModel):
    """Request payload for generating a synthetic check from an OpenAPI spec."""

    raw_spec: str = Field(
        ...,
        description="The raw OpenAPI specification (YAML or JSON string).",
    )
    model: str = Field(
        default="mistral-large-latest",
        description="The Mistral model to use for synthesis.",
    )
    base_url: str | None = Field(
        default=None,
        description="Optional base URL to override the servers defined in the spec.",
    )


class SynthesisResponse(BaseModel):
    """Response payload returning the synthesized check."""

    success: bool = Field(
        ..., description="Whether the synthesis was successful."
    )
    check: SyntheticCheck | None = Field(
        default=None,
        description="The resulting synthetic check definition.",
    )
    model_used: str | None = Field(
        default=None, description="The Mistral model that was used."
    )
    tokens_used: int | None = Field(
        default=None, description="Estimated prompt tokens used."
    )
    synthesis_time_ms: float | None = Field(
        default=None, description="Time taken to synthesize in milliseconds."
    )
    error: str | None = Field(
        default=None, description="Error message if synthesis failed."
    )
    warnings: list[str] = Field(
        default_factory=list,
        description="Any warnings generated during compilation.",
    )
