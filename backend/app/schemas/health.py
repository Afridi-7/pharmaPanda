from typing import Literal

from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    """Liveness: the process is up and serving."""

    status: Literal["ok"] = "ok"
    service: str = Field(examples=["pharmapanda-api"])
    version: str = Field(examples=["0.1.0"])
    environment: str = Field(examples=["development"])


class DatabaseHealthResponse(BaseModel):
    """
    Readiness: the API can reach PostgreSQL.

    Deliberately carries no connection string, driver error text or traceback —
    a failure reports only that the check failed.
    """

    status: Literal["ok", "error"]
    database: Literal["connected", "unavailable"]
    detail: str | None = Field(
        default=None,
        description="Safe, human-readable summary. Never contains credentials or raw driver errors.",
    )
