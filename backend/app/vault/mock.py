"""
Mock Vault Provider for local prototype development.

Provides an in-memory secret store and synthetic credential leasing
without requiring a live HashiCorp Vault instance or any external dependency.
"""

from __future__ import annotations

import uuid
from typing import Any

from .base import BaseVaultProvider, SecretNotFoundError


# Default mock secrets simulating a realistic secret store
_DEFAULT_SECRETS: dict[str, dict[str, Any]] = {
    "services/auth/api-key": {
        "api_key": "mock-api-key-7f3a9b2e",
        "api_secret": "mock-secret-4d8c1f6e",
    },
    "services/auth/oauth": {
        "client_id": "mock-client-id-observe",
        "client_secret": "mock-client-secret-x9k2m",
        "token_url": "https://auth.example.com/oauth/token",
    },
    "services/database/credentials": {
        "username": "observe_readonly",
        "password": "mock-db-pass-h7j3k",
        "host": "localhost",
        "port": 5432,
    },
    "services/monitoring/tokens": {
        "bearer_token": "mock-bearer-eyJhbGciOiJIUzI1NiJ9.mock-payload.mock-sig",
    },
}


class MockVaultProvider(BaseVaultProvider):
    """
    In-memory vault provider for local development and testing.

    Initialized with a configurable dictionary of secrets. Supports
    both static secret retrieval and synthetic credential leasing
    with generated lease IDs and configurable TTLs.
    """

    def __init__(
        self,
        secrets: dict[str, dict[str, Any]] | None = None,
    ) -> None:
        """
        Initialize the mock vault.

        Args:
            secrets: Optional dictionary mapping secret paths to their
                     key-value contents. Falls back to built-in defaults
                     if not provided.
        """
        self._secrets: dict[str, dict[str, Any]] = (
            secrets if secrets is not None else dict(_DEFAULT_SECRETS)
        )
        self._active_leases: dict[str, dict[str, Any]] = {}

    async def get_secret(self, secret_path: str) -> dict[str, Any]:
        """
        Retrieve a mock secret by path.

        Args:
            secret_path: The logical path (e.g., "services/auth/api-key")

        Returns:
            A copy of the secret's key-value pairs.

        Raises:
            SecretNotFoundError: If the path is not in the mock store.
        """
        if secret_path not in self._secrets:
            raise SecretNotFoundError(secret_path)
        # Return a copy to prevent mutation of the internal store
        return dict(self._secrets[secret_path])

    async def lease_credential(self, config: dict[str, Any]) -> dict[str, Any]:
        """
        Generate a synthetic leased credential.

        Args:
            config: Configuration dict. Recognized keys:
                - "role" (str): Credential role name (default: "default")
                - "ttl" (int): Time-to-live in seconds (default: 3600)
                - "secret_path" (str): Optional path to base the credential on

        Returns:
            Dictionary with credential, lease_id, and ttl_seconds.
        """
        role = config.get("role", "default")
        ttl = config.get("ttl", 3600)
        secret_path = config.get("secret_path")

        lease_id = f"lease-{uuid.uuid4().hex[:12]}"

        # If a secret_path is provided, incorporate its data
        base_data: dict[str, Any] = {}
        if secret_path and secret_path in self._secrets:
            base_data = dict(self._secrets[secret_path])

        credential = {
            "credential": f"mock-credential-{role}-{uuid.uuid4().hex[:8]}",
            "lease_id": lease_id,
            "ttl_seconds": ttl,
            "role": role,
            **base_data,
        }

        self._active_leases[lease_id] = credential
        return credential

    def add_secret(self, path: str, data: dict[str, Any]) -> None:
        """Add or update a secret in the mock store (for testing convenience)."""
        self._secrets[path] = dict(data)

    def list_paths(self) -> list[str]:
        """List all available secret paths (for testing/debugging)."""
        return list(self._secrets.keys())
