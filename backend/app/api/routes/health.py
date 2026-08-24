import logging

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import get_db
from app.schemas.health import DatabaseHealthResponse, HealthResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/health", tags=["health"])

SERVICE_NAME = "pharmapanda-api"


@router.get(
    "",
    response_model=HealthResponse,
    summary="Liveness check",
)
def health() -> HealthResponse:
    """Confirms the API process is running. Does not touch the database."""
    return HealthResponse(
        status="ok",
        service=SERVICE_NAME,
        version=settings.APP_VERSION,
        environment=settings.APP_ENV,
    )


@router.get(
    "/db",
    response_model=DatabaseHealthResponse,
    summary="Database readiness check",
)
def health_db(response: Response, db: Session = Depends(get_db)) -> DatabaseHealthResponse:
    """
    Runs `SELECT 1` against PostgreSQL.

    Returns 503 when the database is unreachable so orchestrators can act on the
    status code. The driver error is logged server-side only — the client is
    told that the check failed and nothing more.
    """
    try:
        db.execute(text("SELECT 1"))
    except SQLAlchemyError:
        logger.exception("Database health check failed")
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        return DatabaseHealthResponse(
            status="error",
            database="unavailable",
            detail="Database connection is not available.",
        )

    return DatabaseHealthResponse(
        status="ok",
        database="connected",
        detail="SELECT 1 succeeded.",
    )
