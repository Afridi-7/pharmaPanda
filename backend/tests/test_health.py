"""
Liveness tests.

These must pass with no database running — that is the point of separating
liveness from readiness.
"""

from fastapi.testclient import TestClient


def test_health_returns_200(anon_client: TestClient, api_prefix: str) -> None:
    assert anon_client.get(f"{api_prefix}/health").status_code == 200


def test_health_response_shape(anon_client: TestClient, api_prefix: str) -> None:
    body = anon_client.get(f"{api_prefix}/health").json()

    assert body["status"] == "ok"
    assert body["service"] == "pharmapanda-api"
    assert set(body) == {"status", "service", "version", "environment"}
    assert isinstance(body["version"], str) and body["version"]


def test_health_leaks_no_configuration(anon_client: TestClient, api_prefix: str) -> None:
    """The payload must never carry a connection string or credential."""
    raw = anon_client.get(f"{api_prefix}/health").text.lower()

    for leak in ("postgresql", "password", "psycopg", "@localhost", "database_url"):
        assert leak not in raw


def test_unknown_route_is_404(anon_client: TestClient, api_prefix: str) -> None:
    assert anon_client.get(f"{api_prefix}/health/does-not-exist").status_code == 404


def test_cors_allows_frontend_origin(anon_client: TestClient, api_prefix: str) -> None:
    from app.core.config import settings

    response = anon_client.get(
        f"{api_prefix}/health",
        headers={"Origin": settings.FRONTEND_URL},
    )
    assert response.headers.get("access-control-allow-origin") == settings.FRONTEND_URL


def test_cors_does_not_allow_wildcard(anon_client: TestClient, api_prefix: str) -> None:
    """A wildcard origin would be a real security regression — assert it never appears."""
    response = anon_client.get(
        f"{api_prefix}/health",
        headers={"Origin": "http://evil.example.com"},
    )
    assert response.headers.get("access-control-allow-origin") != "*"
