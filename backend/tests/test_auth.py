"""
Authentication tests.

These run against a dedicated `pharmapanda_test` database; every test is wrapped
in a transaction that is rolled back, so the development database is never
touched.
"""

import uuid
from datetime import datetime, timedelta, timezone

import jwt
import pytest
import sqlalchemy as sa
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import create_access_token
from tests.conftest import requires_postgres

pytestmark = requires_postgres

PREFIX = settings.API_PREFIX
PASSWORD = "correct-horse-battery"


def _registration(email: str = "ada@university.edu", **overrides) -> dict:
    payload = {
        "firstName": "Ada",
        "lastName": "Lovelace",
        "email": email,
        "password": PASSWORD,
        "university": "University of Debrecen",
        "year": "3rd Year",
    }
    payload.update(overrides)
    return payload


def _register(client: TestClient, **kwargs) -> dict:
    response = client.post(f"{PREFIX}/auth/register", json=_registration(**kwargs))
    assert response.status_code == 201, response.text
    return response.json()


def _auth_header(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


# --- Registration ---------------------------------------------------------


def test_register_creates_user_and_returns_token(client: TestClient) -> None:
    body = _register(client)

    assert body["tokenType"] == "bearer"
    assert body["accessToken"]
    assert body["expiresIn"] > 0

    user = body["user"]
    assert user["email"] == "ada@university.edu"
    assert user["firstName"] == "Ada"
    assert user["year"] == "3rd Year"
    assert user["onboarded"] is False
    assert user["experience"] == "Beginner"
    assert user["learningGoals"] == []
    uuid.UUID(user["id"])  # a real UUID primary key


def test_register_persists_row_in_postgres(client: TestClient, db_session: Session) -> None:
    _register(client, email="persisted@university.edu")

    row = db_session.execute(
        sa.text("SELECT email, first_name, onboarded FROM users WHERE email = :e"),
        {"e": "persisted@university.edu"},
    ).one()
    assert row.email == "persisted@university.edu"
    assert row.first_name == "Ada"
    assert row.onboarded is False


def test_register_normalises_email_to_lowercase(client: TestClient) -> None:
    body = _register(client, email="MiXeD@University.EDU")
    assert body["user"]["email"] == "mixed@university.edu"


def test_register_rejects_duplicate_email_with_409(client: TestClient) -> None:
    _register(client, email="dupe@university.edu")

    second = client.post(
        f"{PREFIX}/auth/register", json=_registration(email="dupe@university.edu")
    )
    assert second.status_code == 409

    detail = second.json()["detail"].lower()
    # A clean client error — never SQL, constraint names or driver text.
    for leak in ("sql", "constraint", "psycopg", "integrityerror", "traceback", "unique"):
        assert leak not in detail


def test_duplicate_email_is_case_insensitive(client: TestClient) -> None:
    _register(client, email="case@university.edu")
    second = client.post(
        f"{PREFIX}/auth/register", json=_registration(email="CASE@University.edu")
    )
    assert second.status_code == 409


def test_password_is_hashed_not_plaintext(client: TestClient, db_session: Session) -> None:
    _register(client, email="hash@university.edu")

    stored = db_session.execute(
        sa.text("SELECT password_hash FROM users WHERE email = :e"),
        {"e": "hash@university.edu"},
    ).scalar_one()

    assert stored != PASSWORD
    assert PASSWORD not in stored
    assert stored.startswith("$argon2")  # Argon2id digest, not a homemade scheme


def test_response_never_contains_password_or_hash(client: TestClient) -> None:
    response = client.post(f"{PREFIX}/auth/register", json=_registration(email="safe@university.edu"))
    raw = response.text.lower()

    assert PASSWORD not in response.text
    for leak in ("password", "passwordhash", "password_hash", "$argon2"):
        assert leak not in raw


def test_register_rejects_short_password(client: TestClient) -> None:
    response = client.post(
        f"{PREFIX}/auth/register", json=_registration(email="short@university.edu", password="abc")
    )
    assert response.status_code == 422


def test_register_rejects_invalid_year(client: TestClient) -> None:
    response = client.post(
        f"{PREFIX}/auth/register", json=_registration(email="year@university.edu", year="7th Year")
    )
    assert response.status_code == 422


# --- Login ----------------------------------------------------------------


def test_login_with_correct_credentials(client: TestClient) -> None:
    _register(client, email="login@university.edu")

    response = client.post(
        f"{PREFIX}/auth/login", json={"email": "login@university.edu", "password": PASSWORD}
    )
    assert response.status_code == 200
    assert response.json()["user"]["email"] == "login@university.edu"
    assert response.json()["accessToken"]


def test_login_is_case_insensitive_on_email(client: TestClient) -> None:
    _register(client, email="mixed2@university.edu")
    response = client.post(
        f"{PREFIX}/auth/login", json={"email": "MIXED2@University.EDU", "password": PASSWORD}
    )
    assert response.status_code == 200


def test_login_wrong_password_rejected(client: TestClient) -> None:
    _register(client, email="wrongpw@university.edu")

    response = client.post(
        f"{PREFIX}/auth/login", json={"email": "wrongpw@university.edu", "password": "not-the-password"}
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Incorrect email or password."


def test_login_unknown_email_rejected_identically(client: TestClient) -> None:
    """Unknown email and wrong password must be indistinguishable — no enumeration oracle."""
    _register(client, email="known@university.edu")

    unknown = client.post(
        f"{PREFIX}/auth/login", json={"email": "nobody@university.edu", "password": PASSWORD}
    )
    wrong_password = client.post(
        f"{PREFIX}/auth/login", json={"email": "known@university.edu", "password": "wrong-password"}
    )

    assert unknown.status_code == wrong_password.status_code == 401
    assert unknown.json() == wrong_password.json()


# --- Token / current user -------------------------------------------------


def test_me_with_valid_token(client: TestClient) -> None:
    body = _register(client, email="me@university.edu")

    response = client.get(f"{PREFIX}/auth/me", headers=_auth_header(body["accessToken"]))
    assert response.status_code == 200
    assert response.json()["email"] == "me@university.edu"
    assert "passwordHash" not in response.json()


def test_me_without_token_is_401(client: TestClient) -> None:
    assert client.get(f"{PREFIX}/auth/me").status_code == 401


def test_me_with_malformed_token_is_401(client: TestClient) -> None:
    assert client.get(f"{PREFIX}/auth/me", headers=_auth_header("not-a-jwt")).status_code == 401


def test_me_with_expired_token_is_401(client: TestClient) -> None:
    body = _register(client, email="expired@university.edu")
    user_id = body["user"]["id"]

    expired = jwt.encode(
        {
            "sub": user_id,
            "type": "access",
            "iat": int((datetime.now(timezone.utc) - timedelta(hours=2)).timestamp()),
            "exp": int((datetime.now(timezone.utc) - timedelta(hours=1)).timestamp()),
        },
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )

    assert client.get(f"{PREFIX}/auth/me", headers=_auth_header(expired)).status_code == 401


def test_me_with_token_signed_by_wrong_secret_is_401(client: TestClient) -> None:
    body = _register(client, email="forged@university.edu")
    forged = jwt.encode(
        {
            "sub": body["user"]["id"],
            "type": "access",
            "exp": int((datetime.now(timezone.utc) + timedelta(hours=1)).timestamp()),
        },
        "an-attacker-chosen-secret",
        algorithm="HS256",
    )
    assert client.get(f"{PREFIX}/auth/me", headers=_auth_header(forged)).status_code == 401


def test_me_for_deleted_user_is_401(client: TestClient) -> None:
    token, _ = create_access_token(uuid.uuid4())
    assert client.get(f"{PREFIX}/auth/me", headers=_auth_header(token)).status_code == 401


# --- Onboarding -----------------------------------------------------------


def test_onboarding_updates_database(client: TestClient, db_session: Session) -> None:
    body = _register(client, email="onboard@university.edu")

    response = client.post(
        f"{PREFIX}/auth/onboarding",
        headers=_auth_header(body["accessToken"]),
        json={"goals": ["Clinical reasoning", "Medication safety"], "experience": "Advanced"},
    )
    assert response.status_code == 200

    payload = response.json()
    assert payload["onboarded"] is True
    assert payload["experience"] == "Advanced"
    assert payload["learningGoals"] == ["Clinical reasoning", "Medication safety"]

    row = db_session.execute(
        sa.text("SELECT onboarded, experience_level, learning_goals FROM users WHERE email = :e"),
        {"e": "onboard@university.edu"},
    ).one()
    assert row.onboarded is True
    assert row.experience_level == "Advanced"
    assert row.learning_goals == ["Clinical reasoning", "Medication safety"]


def test_onboarding_requires_authentication(client: TestClient) -> None:
    response = client.post(
        f"{PREFIX}/auth/onboarding", json={"goals": [], "experience": "Beginner"}
    )
    assert response.status_code == 401


def test_onboarding_rejects_unknown_goal(client: TestClient) -> None:
    body = _register(client, email="badgoal@university.edu")
    response = client.post(
        f"{PREFIX}/auth/onboarding",
        headers=_auth_header(body["accessToken"]),
        json={"goals": ["Astrophysics"], "experience": "Beginner"},
    )
    assert response.status_code == 422


# --- Profile --------------------------------------------------------------


def test_profile_update_persists(client: TestClient, db_session: Session) -> None:
    body = _register(client, email="profile@university.edu")

    response = client.patch(
        f"{PREFIX}/auth/profile",
        headers=_auth_header(body["accessToken"]),
        json={"firstName": "Grace", "university": "Semmelweis", "year": "5th Year"},
    )
    assert response.status_code == 200
    assert response.json()["firstName"] == "Grace"
    assert response.json()["year"] == "5th Year"

    row = db_session.execute(
        sa.text("SELECT first_name, university, year_of_study FROM users WHERE email = :e"),
        {"e": "profile@university.edu"},
    ).one()
    assert (row.first_name, row.university, row.year_of_study) == ("Grace", "Semmelweis", "5th Year")


def test_profile_update_requires_authentication(client: TestClient) -> None:
    assert client.patch(f"{PREFIX}/auth/profile", json={"firstName": "X"}).status_code == 401


@pytest.mark.parametrize(
    "forbidden",
    [
        {"id": "00000000-0000-0000-0000-000000000000"},
        {"passwordHash": "$argon2id$hijacked"},
        {"password_hash": "$argon2id$hijacked"},
        {"email": "attacker@evil.com"},
        {"onboarded": True},
        {"streakDays": 9999},
        {"createdAt": "2020-01-01T00:00:00Z"},
    ],
)
def test_profile_update_rejects_protected_fields(client: TestClient, forbidden: dict) -> None:
    """Mass assignment must fail loudly (422), not be silently ignored."""
    body = _register(client, email=f"protect-{next(iter(forbidden))}@university.edu")

    response = client.patch(
        f"{PREFIX}/auth/profile", headers=_auth_header(body["accessToken"]), json=forbidden
    )
    assert response.status_code == 422


def test_protected_fields_unchanged_in_database(client: TestClient, db_session: Session) -> None:
    body = _register(client, email="unchanged@university.edu")
    original_id = body["user"]["id"]

    before = db_session.execute(
        sa.text("SELECT password_hash FROM users WHERE email = :e"),
        {"e": "unchanged@university.edu"},
    ).scalar_one()

    client.patch(
        f"{PREFIX}/auth/profile",
        headers=_auth_header(body["accessToken"]),
        json={"firstName": "Renamed"},
    )

    after = db_session.execute(
        sa.text("SELECT id, email, password_hash FROM users WHERE first_name = 'Renamed'"),
    ).one()
    assert str(after.id) == original_id
    assert after.email == "unchanged@university.edu"
    assert after.password_hash == before


# --- Logout ---------------------------------------------------------------


def test_logout_returns_204(client: TestClient) -> None:
    body = _register(client, email="logout@university.edu")
    response = client.post(f"{PREFIX}/auth/logout", headers=_auth_header(body["accessToken"]))
    assert response.status_code == 204


def test_logout_requires_authentication(client: TestClient) -> None:
    assert client.post(f"{PREFIX}/auth/logout").status_code == 401


# --- Round trip -----------------------------------------------------------


def test_register_logout_login_round_trip(client: TestClient) -> None:
    """The full journey the frontend performs, against one database row."""
    registered = _register(client, email="roundtrip@university.edu")

    client.post(f"{PREFIX}/auth/onboarding",
                headers=_auth_header(registered["accessToken"]),
                json={"goals": ["History taking"], "experience": "Intermediate"})
    client.post(f"{PREFIX}/auth/logout", headers=_auth_header(registered["accessToken"]))

    again = client.post(
        f"{PREFIX}/auth/login", json={"email": "roundtrip@university.edu", "password": PASSWORD}
    )
    assert again.status_code == 200
    assert again.json()["user"]["onboarded"] is True
    assert again.json()["user"]["learningGoals"] == ["History taking"]
    assert again.json()["user"]["id"] == registered["user"]["id"]
