"""
Shared API dependencies.

`get_current_user` is the single place JWT parsing happens. Future protected
routers (attempts, progress, settings) depend on it rather than re-implementing
token handling.
"""

from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.security import TokenError, decode_access_token
from app.db.session import get_db
from app.models.user import User
from app.services import user_service

# auto_error=False so a missing header produces our own 401 with a
# WWW-Authenticate challenge, rather than Starlette's bare 403.
_bearer = HTTPBearer(auto_error=False)

_UNAUTHORISED = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Not authenticated.",
    headers={"WWW-Authenticate": "Bearer"},
)


def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)],
    db: Annotated[Session, Depends(get_db)],
) -> User:
    """
    Resolve the caller from a Bearer token.

    Every failure — absent, malformed, expired, wrong type, or pointing at a
    deleted user — answers with the same 401 and message, so the endpoint never
    becomes an oracle for which tokens or accounts exist.
    """
    if credentials is None or not credentials.credentials:
        raise _UNAUTHORISED

    try:
        user_id = decode_access_token(credentials.credentials)
    except TokenError:
        raise _UNAUTHORISED from None

    user = user_service.get_by_id(db, user_id)
    if user is None:
        raise _UNAUTHORISED

    return user


CurrentUser = Annotated[User, Depends(get_current_user)]
DbSession = Annotated[Session, Depends(get_db)]
