import time
from typing import Any

from mistralai.client import Mistral
from pydantic import ValidationError

from ..models.domain import SyntheticCheck
from .preprocessor import sanitize_openapi_spec, truncate_spec
from .prompts import SYSTEM_PROMPT, build_user_prompt


class AgenticFlowCompiler:
    """
    Mistral AI-powered OpenAPI compiler.
    Parses a spec and synthesizes a structured, executable SyntheticCheck.
    """

    def __init__(self, client: Mistral, default_model: str = "mistral-large-latest") -> None:
        self.client = client
        self.default_model = default_model

    async def synthesize(
        self,
        raw_spec: str,
        model: str | None = None,
        base_url: str | None = None,
    ) -> tuple[SyntheticCheck, dict[str, Any]]:
        """
        Analyze an OpenAPI spec and return a compiled SyntheticCheck.

        Returns:
            Tuple of (SyntheticCheck, metrics_dict)
        """
        start_time = time.perf_counter()
        active_model = model or self.default_model
        warnings = []

        # 1. Preprocess the spec
        try:
            sanitized_spec = sanitize_openapi_spec(raw_spec)
            spec_json = truncate_spec(sanitized_spec)
            if "warning" in spec_json:
                warnings.append("Spec was heavily truncated to fit context limits.")
        except Exception as exc:
            raise ValueError(f"Spec preprocessing failed: {exc}")

        # 2. Build prompts
        user_prompt = build_user_prompt(spec_json, base_url)

        # 3. Call Mistral with Structured Output (client.chat.parse)
        # Using chat.parse requires mistralai>=1.0.0. Since we added it to requirements,
        # we can use the Pydantic integration directly.
        try:
            # We are using asynchronous client if possible, but mistral client might be sync
            # To be safe with async/await, we should check if client has async methods or just use run_in_executor
            # But recent Mistral Python SDK supports async via MistralClient or MistralAsyncClient.
            # Assuming we initialize standard Mistral client and wrap it if needed, or Mistral async client.
            # Actually, `mistralai.Mistral` doesn't natively expose `chat.parse` as async unless we use `client.chat.parse_async` or similar. 
            # In mistralai 1.0+, you can do client.chat.parse(...).
            
            # For simplicity, we use the synchronous call but ideally we'd use the async client.
            # Assuming `self.client` is an initialized `mistralai.Mistral` instance.
            chat_response = await self.client.chat.parse_async(
                model=active_model,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": user_prompt},
                ],
                response_format=SyntheticCheck,
                temperature=0.1,
            )
        except AttributeError:
            # Fallback if Mistral async client is initialized differently
            chat_response = self.client.chat.parse(
                model=active_model,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": user_prompt},
                ],
                response_format=SyntheticCheck,
                temperature=0.1,
            )
        except Exception as exc:
            raise RuntimeError(f"Mistral API call failed: {exc}")

        # 4. Extract parsed Pydantic object
        if not chat_response.choices:
            raise RuntimeError("Mistral API returned no choices.")
            
        message = chat_response.choices[0].message
        if not hasattr(message, "parsed") or message.parsed is None:
            # Fallback parsing if the SDK didn't auto-parse
            import json
            try:
                check = SyntheticCheck.model_validate(json.loads(message.content))
            except Exception as parse_exc:
                raise RuntimeError(f"Failed to parse Mistral output: {parse_exc}")
        else:
            check = message.parsed

        # Collect metrics
        duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
        tokens_used = chat_response.usage.prompt_tokens if hasattr(chat_response, "usage") and chat_response.usage else 0

        metrics = {
            "model": active_model,
            "duration_ms": duration_ms,
            "tokens_used": tokens_used,
            "warnings": warnings,
        }

        return check, metrics
