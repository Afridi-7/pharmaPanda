"""
Readiness tests for GET /api/health/db.

The first two use a stubbed session so the contract (both success and failure)
is verified without a database. The last one is a real integration test against
PostgreSQL and skips when it is not running.
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.exc import OperationalError

from app.core.config import settings
from app.db.session import get_db
from app.main import app


class _StubSession:
    """Minimal stand-in for a SQLAlchemy Session."""

    def __init__(self, raises: Exception | None = None) -> None:
        self._raises = raises

    def execute(self, *_args, **_kwargs):
        if self._raises is not None:
            raise self._raises
        return None

    def rollback(self) -> None:  # pragma: no cover - invoked only on the error path
        pass

    def close(self) -> None:
        pass


def _override(session: _StubSession):
    def _dependency():
        yield session

    return _dependency


@pytest.fixture(autouse=True)
def _clear_overrides():
    yield
    app.dependency_overrides.clear()


def test_db_health_ok_when_query_succeeds() -> None:
    app.dependency_overrides[get_db] = _override(_StubSession())

    with TestClient(app, raise_server_exceptions=False) as client:
        response = client.get(f"{settings.API_PREFIX}/health/db")

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["database"] == "connected"


def test_db_health_reports_503_without_leaking_details() -> None:
    """A driver failure must yield a safe message — no DSN, credentials or traceback."""
    failure = OperationalError(
        "SELECT 1",
        {},
        Exception('connection to server at "localhost", port 5432 failed: password authentication failed'),
    )
    app.dependency_overrides[get_db] = _override(_StubSession(raises=failure))

    with TestClient(app, raise_server_exceptions=False) as client:
        response = client.get(f"{settings.API_PREFIX}/health/db")

    assert response.status_code == 503
    body = response.json()
    assert body["status"] == "error"
    assert body["database"] == "unavailable"

    raw = response.text.lower()
    for leak in ("password", "psycopg", "traceback", "select 1 failed", "authentication"):
        assert leak not in raw


@pytest.mark.integration
def test_db_health_against_real_postgres() -> None:
    """Real end-to-end check. Skipped when PostgreSQL is not reachable."""
    from sqlalchemy import text

    from app.db.session import engine

    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
    except Exception:  # noqa: BLE001 - any connection failure means "not available here"
        pytest.skip("PostgreSQL is not running — start it with: docker compose up -d db")

    with TestClient(app) as client:
        response = client.get(f"{settings.API_PREFIX}/health/db")

    assert response.status_code == 200
    assert response.json()["database"] == "connected"
