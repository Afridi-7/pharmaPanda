import logging

from fastapi import APIRouter, HTTPException, status

from app.api.deps import CurrentUser, DbSession
from app.core.security import create_access_token
from app.schemas.user import (
    AuthResponse,
    LoginRequest,
    OnboardingRequest,
    ProfileUpdateRequest,
    RegisterRequest,
    UserResponse,
)
from app.services import user_service
from app.services.user_service import EmailAlreadyRegisteredError

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["auth"])

# Deliberately identical for "no such email" and "wrong password" — a distinct
# message for either one turns this endpoint into an account-enumeration oracle.
INVALID_CREDENTIALS = "Incorrect email or password."


def _authenticated(user) -> AuthResponse:  # noqa: ANN001 - ORM model, avoids circular import
    token, expires_in = create_access_token(user.id)
    return AuthResponse(
        access_token=token,
        token_type="bearer",
        expires_in=expires_in,
        user=UserResponse.from_user(user),
    )


@router.post(
    "/register",
    response_model=AuthResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create an account",
)
def register(payload: RegisterRequest, db: DbSession) -> AuthResponse:
    """Create the user, hash the password, and return an authenticated session."""
    try:
        user = user_service.register(db, payload)
    except EmailAlreadyRegisteredError:
        # 409 without echoing the address back, and with no SQL detail.
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with that email address already exists.",
        ) from None

    logger.info("Registered user %s", user.id)
    return _authenticated(user)


@router.post("/login", response_model=AuthResponse, summary="Sign in")
def login(payload: LoginRequest, db: DbSession) -> AuthResponse:
    user = user_service.authenticate(db, payload.email, payload.password)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=INVALID_CREDENTIALS,
            headers={"WWW-Authenticate": "Bearer"},
        )

    logger.info("Login for user %s", user.id)
    return _authenticated(user)


@router.get("/me", response_model=UserResponse, summary="Current user")
def me(current_user: CurrentUser) -> UserResponse:
    return UserResponse.from_user(current_user)


@router.post("/onboarding", response_model=UserResponse, summary="Complete onboarding")
def onboarding(
    payload: OnboardingRequest, current_user: CurrentUser, db: DbSession
) -> UserResponse:
    user = user_service.complete_onboarding(db, current_user, payload)
    return UserResponse.from_user(user)


@router.patch("/profile", response_model=UserResponse, summary="Update profile")
def update_profile(
    payload: ProfileUpdateRequest, current_user: CurrentUser, db: DbSession
) -> UserResponse:
    user = user_service.update_profile(db, current_user, payload)
    return UserResponse.from_user(user)


@router.post(
    "/logout",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Sign out",
)
def logout(current_user: CurrentUser) -> None:
    """
    Logout for stateless bearer auth.

    Access tokens are self-contained and short-lived, so there is no server-side
    session to destroy: the client discards its token and the existing one
    simply expires. This endpoint exists so the frontend has an explicit,
    auditable call, and so revocation (a denylist or token version column) can
    be added here later without changing the client contract.
    """
    logger.info("Logout for user %s", current_user.id)
    return None
