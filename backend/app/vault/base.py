"""
Abstract Vault Secret Provider interface.

Defines the contract for secret retrieval and credential leasing.
All implementations must be async-compatible to support non-blocking
operations in the execution engine pipeline.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any


class SecretNotFoundError(Exception):
    """Raised when a requested secret path does not exist in the vault."""

    def __init__(self, secret_path: str) -> None:
        self.secret_path = secret_path
        super().__init__(f"Secret not found at path: {secret_path}")


class BaseVaultProvider(ABC):
    """
    Abstract base class for vault secret providers.

    Implementations must provide async methods for:
    - Retrieving static secrets by path
    - Leasing dynamic credentials with TTL management

    This abstraction allows swapping between local mock providers
    and production vault backends (HashiCorp Vault, AWS Secrets Manager, etc.)
    without changing the execution engine.
    """

    @abstractmethod
    async def get_secret(self, secret_path: str) -> dict[str, Any]:
        """
        Retrieve a secret by its path.

        Args:
            secret_path: The logical path to the secret (e.g., "services/auth/api-key")

        Returns:
            Dictionary containing the secret's key-value pairs.

        Raises:
            SecretNotFoundError: If the secret path does not exist.
        """
        ...

    @abstractmethod
    async def lease_credential(self, config: dict[str, Any]) -> dict[str, Any]:
        """
        Lease a dynamic credential based on the provided configuration.

        Args:
            config: Configuration for credential generation. Structure depends
                     on the backend (e.g., {"role": "readonly", "ttl": "1h"}).

        Returns:
            Dictionary containing at minimum:
                - "credential": The leased credential value
                - "lease_id": Unique identifier for this lease
                - "ttl_seconds": Time-to-live in seconds
        """
        ...
