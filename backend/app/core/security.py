"""
Password hashing and JWT issuing/decoding.

Hashing is delegated to `pwdlib` with Argon2id (the current password-hashing
competition winner and the OWASP default recommendation). Nothing here is
hand-rolled cryptography.
"""

import uuid
from datetime import datetime, timedelta, timezone
from typing import Any

import jwt
from pwdlib import PasswordHash

from app.core.config import settings

# Argon2id with pwdlib's recommended parameters.
_password_hash = PasswordHash.recommended()

TOKEN_TYPE = "bearer"


class TokenError(Exception):
    """Raised when a token is missing, malformed, expired or otherwise invalid."""


def hash_password(password: str) -> str:
    """Return an Argon2id digest. The plaintext is never stored or logged."""
    return _password_hash.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    """
    Constant-time-ish verification that never raises on malformed input.

    A corrupt or truncated digest is treated as a failed login rather than a
    500, so a bad row cannot become an availability problem.
    """
    try:
        return _password_hash.verify(password, password_hash)
    except Exception:  # noqa: BLE001 - any hashing failure is simply "not verified"
        return False


def create_access_token(
    subject: uuid.UUID | str,
    expires_minutes: int | None = None,
) -> tuple[str, int]:
    """
    Issue a signed access token for `subject` (the user id).

    Returns `(token, expires_in_seconds)` so the client can act on lifetime
    without having to decode the token itself.
    """
    minutes = expires_minutes if expires_minutes is not None else settings.ACCESS_TOKEN_EXPIRE_MINUTES
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(minutes=minutes)

    payload: dict[str, Any] = {
        "sub": str(subject),
        "iat": int(now.timestamp()),
        "exp": int(expires_at.timestamp()),
        "type": "access",
    }
    token = jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return token, minutes * 60


def decode_access_token(token: str) -> uuid.UUID:
    """
    Validate signature, expiry and shape; return the subject user id.

    Raises `TokenError` for every failure mode so callers answer 401 uniformly
    and never leak which specific check failed.
    """
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
            options={"require": ["exp", "sub"]},
        )
    except jwt.PyJWTError as exc:
        raise TokenError("Invalid or expired token") from exc

    if payload.get("type") != "access":
        raise TokenError("Wrong token type")

    subject = payload.get("sub")
    try:
        return uuid.UUID(str(subject))
    except (TypeError, ValueError) as exc:
        raise TokenError("Malformed token subject") from exc
