from functools import lru_cache
from typing import Literal

from pydantic import Field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# Shipped development fallback. Refused outside development — see Settings below.
DEV_JWT_SECRET = "dev-only-insecure-secret-change-me"


class Settings(BaseSettings):
    """
    Typed application configuration.

    Values come from the process environment, falling back to `backend/.env`
    during local development. Nothing here carries a real credential default:
    `DATABASE_URL` points at the docker-compose development database, which is
    disposable by design.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    APP_NAME: str = "PharmaPanda API"
    APP_VERSION: str = "0.1.0"
    APP_ENV: Literal["development", "test", "staging", "production"] = "development"
    DEBUG: bool = True
    API_PREFIX: str = "/api"

    # Development default matches docker-compose.yml. Override in every other
    # environment via the real process environment, never by editing this file.
    DATABASE_URL: str = "postgresql+psycopg://pharmapanda:pharmapanda@localhost:5432/pharmapanda"

    FRONTEND_URL: str = "http://localhost:5173"

    # Extra browser origins allowed to call the API, comma-separated.
    EXTRA_CORS_ORIGINS: str = Field(default="")

    # --- Auth ---------------------------------------------------------------
    # Development-only fallback. Any non-development environment MUST supply its
    # own value; `_reject_default_secret_in_production` below enforces that.
    JWT_SECRET_KEY: str = DEV_JWT_SECRET
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 12

    # Mirrors the frontend's 8-character rule so both layers agree.
    MIN_PASSWORD_LENGTH: int = 8

    @field_validator("JWT_SECRET_KEY")
    @classmethod
    def _reject_weak_secret(cls, value: str) -> str:
        if not value or not value.strip():
            raise ValueError("JWT_SECRET_KEY must not be empty")
        return value

    @field_validator("API_PREFIX")
    @classmethod
    def _normalise_prefix(cls, value: str) -> str:
        """Guarantee a leading slash and no trailing slash, so route joins are predictable."""
        value = "/" + value.strip().strip("/")
        return "" if value == "/" else value

    @property
    def cors_origins(self) -> list[str]:
        """Explicit origin allow-list. Never a wildcard — credentials are enabled."""
        origins = [self.FRONTEND_URL, *self.EXTRA_CORS_ORIGINS.split(",")]
        seen: list[str] = []
        for origin in (o.strip().rstrip("/") for o in origins):
            if origin and origin not in seen:
                seen.append(origin)
        return seen

    @property
    def is_production(self) -> bool:
        return self.APP_ENV == "production"

    @model_validator(mode="after")
    def _reject_default_secret_outside_development(self) -> "Settings":
        """The shipped development secret must never protect real sessions."""
        if self.APP_ENV in {"staging", "production"} and self.JWT_SECRET_KEY == DEV_JWT_SECRET:
            raise ValueError(
                "JWT_SECRET_KEY is still the development default. "
                "Set a unique secret in the environment for this deployment."
            )
        return self


@lru_cache
def get_settings() -> Settings:
    """Cached accessor so the environment is parsed once per process."""
    return Settings()


settings = get_settings()
