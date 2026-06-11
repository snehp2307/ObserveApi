"""
FastAPI application entry point.

Configures the ASGI application with:
- Lifespan-managed httpx.AsyncClient
- CORS middleware for frontend communication
- Prototype API routes
"""

from __future__ import annotations

from contextlib import asynccontextmanager
from typing import AsyncGenerator

import os
from dotenv import load_dotenv

load_dotenv()
import httpx
from fastapi import FastAPI
from mistralai.client import Mistral
from fastapi.middleware.cors import CORSMiddleware

from .routes import prototype_router


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """
    Manage application lifecycle resources.

    Creates a shared httpx.AsyncClient on startup and closes it on shutdown.
    """
    app.state.http_client = httpx.AsyncClient(
        timeout=httpx.Timeout(30.0, connect=10.0),
        follow_redirects=True,
        limits=httpx.Limits(max_connections=50, max_keepalive_connections=10),
    )
    # Initialize Mistral AI client
    mistral_key = os.environ.get("MISTRAL_API_KEY")
    if mistral_key:
        app.state.mistral_client = Mistral(api_key=mistral_key)
    else:
        app.state.mistral_client = None

    yield
    await app.state.http_client.aclose()


app = FastAPI(
    title="Observe API — Synthetic Monitoring Prototype",
    description=(
        "Phase 1 interactive prototype for the Unified Synthetic API Monitoring Platform. "
        "Provides endpoints for composing and executing multi-step synthetic checks "
        "with variable chaining, assertions, and structured observability telemetry."
    ),
    version="0.1.0",
    lifespan=lifespan,
)

# CORS — allow the Vite dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routes
app.include_router(prototype_router)
