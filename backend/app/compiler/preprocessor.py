import json
from typing import Any

import yaml


def sanitize_openapi_spec(raw_spec: str) -> dict[str, Any]:
    """
    Parse a YAML or JSON OpenAPI spec and sanitize it for the AI compiler.

    Strips overly verbose descriptions, examples, and x-extensions to
    reduce token usage.
    """
    try:
        spec = yaml.safe_load(raw_spec)
        if not isinstance(spec, dict):
            raise ValueError("Spec must be a dictionary at the root")
    except Exception as exc:
        raise ValueError(f"Failed to parse OpenAPI spec: {exc}")

    return _clean_node(spec)


def _clean_node(node: Any) -> Any:
    """Recursively clean an OpenAPI spec node to minimize size."""
    if isinstance(node, dict):
        cleaned = {}
        for k, v in node.items():
            # Strip vendor extensions
            if str(k).startswith("x-"):
                continue

            # Strip verbose examples to save context tokens
            if k in ("example", "examples"):
                continue

            # Truncate long descriptions
            if k == "description" and isinstance(v, str):
                if len(v) > 200:
                    cleaned[k] = v[:197] + "..."
                else:
                    cleaned[k] = v
            else:
                cleaned[k] = _clean_node(v)
        return cleaned
    elif isinstance(node, list):
        return [_clean_node(item) for item in node]
    else:
        return node


def truncate_spec(spec_dict: dict[str, Any], max_chars: int = 40000) -> str:
    """
    Serialize the spec to JSON and truncate if it exceeds the rough char limit.
    This acts as a last resort before hitting the model context limit.
    """
    serialized = json.dumps(spec_dict, separators=(",", ":"))
    if len(serialized) <= max_chars:
        return serialized

    # Aggressive truncation: remove description fields entirely
    def _strip_descriptions(node: Any) -> Any:
        if isinstance(node, dict):
            return {
                k: _strip_descriptions(v)
                for k, v in node.items()
                if k != "description"
            }
        elif isinstance(node, list):
            return [_strip_descriptions(item) for item in node]
        return node

    stripped = _strip_descriptions(spec_dict)
    serialized = json.dumps(stripped, separators=(",", ":"))
    
    if len(serialized) > max_chars:
        # Ultimate fallback: string truncation (may break JSON, but protects memory)
        return serialized[:max_chars] + '... {"warning": "spec truncated"}'

    return serialized
