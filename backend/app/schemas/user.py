"""
Auth request/response schemas.

The API speaks camelCase because the existing React `User` type already does.
`alias_generator=to_camel` handles that on the way out, and `populate_by_name`
lets tests and internal callers still use snake_case field names.
"""

import uuid
from datetime import datetime
from typing import Annotated, Literal

from pydantic import (
    BaseModel,
    ConfigDict,
    EmailStr,
    Field,
    field_validator,
)
from pydantic.alias_generators import to_camel

from app.core.config import settings

# Values mirror the existing frontend contract exactly — see src/types/index.ts.
YearOfStudy = Literal["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year", "Graduate"]
ExperienceLevel = Literal["Beginner", "Intermediate", "Advanced"]
LearningGoal = Literal[
    "Clinical reasoning",
    "Patient counseling",
    "Medication safety",
    "History taking",
    "Pharmacy calculations",
    "OSCE preparation",
]

Password = Annotated[str, Field(min_length=settings.MIN_PASSWORD_LENGTH, max_length=128)]


class CamelModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
    )


def _normalise_email(value: str) -> str:
    return value.strip().lower()


class RegisterRequest(CamelModel):
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    password: Password
    university: str = Field(min_length=1, max_length=200)
    year: YearOfStudy

    @field_validator("email")
    @classmethod
    def _lower(cls, value: str) -> str:
        return _normalise_email(value)

    @field_validator("first_name", "last_name", "university")
    @classmethod
    def _strip(cls, value: str) -> str:
        return value.strip()


class LoginRequest(CamelModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)

    @field_validator("email")
    @classmethod
    def _lower(cls, value: str) -> str:
        return _normalise_email(value)


class OnboardingRequest(CamelModel):
    goals: list[LearningGoal] = Field(default_factory=list)
    experience: ExperienceLevel


class ProfileUpdateRequest(CamelModel):
    """
    Explicit allow-list of patchable fields.

    Everything omitted here — id, password_hash, email, onboarded, timestamps —
    is deliberately unpatchable. `extra="forbid"` makes an attempt to set one a
    422 rather than a silently ignored field.
    """

    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
        extra="forbid",
    )

    first_name: str | None = Field(default=None, min_length=1, max_length=100)
    last_name: str | None = Field(default=None, min_length=1, max_length=100)
    university: str | None = Field(default=None, min_length=1, max_length=200)
    year: YearOfStudy | None = None
    avatar_seed: str | None = Field(default=None, min_length=1, max_length=120)
    learning_goals: list[LearningGoal] | None = None
    experience: ExperienceLevel | None = None


class UserResponse(CamelModel):
    """
    Public user payload. Shaped to match the React `User` type.

    `password_hash` is absent by construction — this model is built field by
    field, so a hash cannot leak by accident.
    """

    id: uuid.UUID
    first_name: str
    last_name: str
    email: EmailStr
    university: str
    year: str
    avatar_seed: str
    experience: str
    learning_goals: list[str]
    onboarded: bool
    joined_at: datetime
    streak_days: int

    @classmethod
    def from_user(cls, user) -> "UserResponse":  # noqa: ANN001 - avoids a circular import
        return cls(
            id=user.id,
            first_name=user.first_name,
            last_name=user.last_name,
            email=user.email,
            university=user.university,
            year=user.year_of_study,
            avatar_seed=user.avatar_seed,
            experience=user.experience_level,
            learning_goals=list(user.learning_goals or []),
            onboarded=user.onboarded,
            joined_at=user.created_at,
            streak_days=user.streak_days,
        )


class AuthResponse(CamelModel):
    """Token plus the user, so the client needs a single round trip after login."""

    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse
