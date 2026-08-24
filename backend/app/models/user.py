import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, String, func, text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class User(Base):
    """
    A registered PharmaPanda student.

    Column values deliberately mirror the strings the existing React app already
    uses ("3rd Year", "Intermediate", …) rather than introducing a separate
    database vocabulary. Validation lives in the Pydantic schemas, so the
    contract is enforced once at the API boundary instead of being duplicated as
    a PostgreSQL ENUM that would need a migration every time an option changes.
    """

    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()"),
    )

    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)

    # Stored lowercase (normalised in the schema layer) so uniqueness is
    # case-insensitive without needing CITEXT or a functional index.
    email: Mapped[str] = mapped_column(
        String(320), nullable=False, unique=True, index=True
    )

    # Argon2id digest. The plaintext password is never stored or logged.
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)

    university: Mapped[str] = mapped_column(String(200), nullable=False)
    year_of_study: Mapped[str] = mapped_column(String(32), nullable=False)
    experience_level: Mapped[str] = mapped_column(
        String(32), nullable=False, server_default=text("'Beginner'")
    )

    # Free-form list of goal strings. JSONB rather than a join table: the set is
    # small, read whole, and never queried relationally at this stage.
    learning_goals: Mapped[list[str]] = mapped_column(
        JSONB, nullable=False, default=list, server_default=text("'[]'::jsonb")
    )

    onboarded: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default=text("false")
    )
    avatar_seed: Mapped[str] = mapped_column(String(120), nullable=False)
    streak_days: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, server_default=text("0")
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    def __repr__(self) -> str:  # pragma: no cover - debugging aid
        # Never interpolate password_hash into a repr.
        return f"<User id={self.id} email={self.email!r} onboarded={self.onboarded}>"
