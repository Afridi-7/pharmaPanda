"""
User persistence and authentication logic.

Routes stay thin: they translate HTTP to these calls and back. Every write path
goes through here so password hashing can never be bypassed.
"""

import uuid

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.security import hash_password, verify_password
from app.models.user import User
from app.schemas.user import OnboardingRequest, ProfileUpdateRequest, RegisterRequest


class EmailAlreadyRegisteredError(Exception):
    """Raised when a registration collides with an existing account."""


def get_by_id(db: Session, user_id: uuid.UUID) -> User | None:
    return db.get(User, user_id)


def get_by_email(db: Session, email: str) -> User | None:
    normalised = email.strip().lower()
    return db.execute(select(User).where(User.email == normalised)).scalar_one_or_none()


def _default_avatar_seed(first_name: str) -> str:
    slug = "".join(ch for ch in first_name.lower() if ch.isalnum()) or "student"
    return f"panda-{slug}"


def register(db: Session, payload: RegisterRequest) -> User:
    """
    Create a user with an Argon2id password digest.

    The uniqueness check is advisory — the database constraint is authoritative,
    so a concurrent duplicate is caught by the IntegrityError path rather than
    slipping through the race between SELECT and INSERT.
    """
    if get_by_email(db, payload.email) is not None:
        raise EmailAlreadyRegisteredError(payload.email)

    user = User(
        first_name=payload.first_name,
        last_name=payload.last_name,
        email=payload.email,
        password_hash=hash_password(payload.password),
        university=payload.university,
        year_of_study=payload.year,
        experience_level="Beginner",
        learning_goals=[],
        onboarded=False,
        avatar_seed=_default_avatar_seed(payload.first_name),
        streak_days=0,
    )

    db.add(user)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise EmailAlreadyRegisteredError(payload.email) from exc

    db.refresh(user)
    return user


def authenticate(db: Session, email: str, password: str) -> User | None:
    """
    Verify credentials, returning None for every failure mode.

    The caller must not distinguish "no such email" from "wrong password" in its
    response wording — that difference is an account-enumeration oracle.
    """
    user = get_by_email(db, email)
    if user is None:
        # Hash anyway so a missing account and a wrong password take comparable
        # time, blunting timing-based enumeration.
        verify_password(password, _DUMMY_HASH)
        return None

    if not verify_password(password, user.password_hash):
        return None

    return user


def complete_onboarding(db: Session, user: User, payload: OnboardingRequest) -> User:
    user.learning_goals = list(payload.goals)
    user.experience_level = payload.experience
    user.onboarded = True

    db.commit()
    db.refresh(user)
    return user


def update_profile(db: Session, user: User, payload: ProfileUpdateRequest) -> User:
    """
    Apply an allow-listed patch.

    Only fields present on ProfileUpdateRequest can be reached, and each maps
    explicitly to a column — there is no `setattr(user, key, value)` loop, so a
    protected column cannot be written even if the schema later grows a field.
    """
    changes = payload.model_dump(exclude_unset=True)

    if "first_name" in changes and changes["first_name"] is not None:
        user.first_name = changes["first_name"].strip()
    if "last_name" in changes and changes["last_name"] is not None:
        user.last_name = changes["last_name"].strip()
    if "university" in changes and changes["university"] is not None:
        user.university = changes["university"].strip()
    if "year" in changes and changes["year"] is not None:
        user.year_of_study = changes["year"]
    if "avatar_seed" in changes and changes["avatar_seed"] is not None:
        user.avatar_seed = changes["avatar_seed"]
    if "learning_goals" in changes and changes["learning_goals"] is not None:
        user.learning_goals = list(changes["learning_goals"])
    if "experience" in changes and changes["experience"] is not None:
        user.experience_level = changes["experience"]

    db.commit()
    db.refresh(user)
    return user


# Precomputed digest used to equalise timing on the unknown-email path.
_DUMMY_HASH = hash_password("pharmapanda-timing-equaliser")
