import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func, text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Attempt(Base):
    """
    One consultation, owned by a user.

    The transcript, recorded actions and revealed-fact ids are JSONB rather than
    child tables: they are always read and written as a whole attempt, never
    queried across attempts, and keeping them inline makes the write path a
    single row update.
    """

    __tablename__ = "attempts"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    scenario_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("scenarios.id", ondelete="RESTRICT"), nullable=False, index=True
    )

    status: Mapped[str] = mapped_column(
        String(32), nullable=False, server_default=text("'in-progress'")
    )
    duration_seconds: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("0"))

    messages: Mapped[list[dict]] = mapped_column(JSONB, nullable=False, server_default=text("'[]'::jsonb"))
    actions: Mapped[list[dict]] = mapped_column(JSONB, nullable=False, server_default=text("'[]'::jsonb"))
    revealed_fact_ids: Mapped[list[str]] = mapped_column(
        JSONB, nullable=False, server_default=text("'[]'::jsonb")
    )
    objectives_met: Mapped[list[str]] = mapped_column(
        JSONB, nullable=False, server_default=text("'[]'::jsonb")
    )

    notes: Mapped[str] = mapped_column(Text, nullable=False, server_default=text("''"))

    # Structured decisions. Null until the student commits to one.
    recommendation_choice: Mapped[str | None] = mapped_column(String(64), nullable=True)
    recommendation_reasoning: Mapped[str | None] = mapped_column(Text, nullable=True)
    counseling: Mapped[str | None] = mapped_column(Text, nullable=True)
    referral_choice: Mapped[str | None] = mapped_column(String(64), nullable=True)
    referral_reasoning: Mapped[str | None] = mapped_column(Text, nullable=True)

    score: Mapped[int | None] = mapped_column(Integer, nullable=True)

    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    evaluation: Mapped["Evaluation | None"] = relationship(
        back_populates="attempt", cascade="all, delete-orphan", uselist=False, lazy="selectin"
    )


class Evaluation(Base):
    """
    The report for a finished attempt.

    Persisted rather than recomputed so a historical report never silently
    changes when the scoring rules are revised.
    """

    __tablename__ = "evaluations"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    attempt_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("attempts.id", ondelete="CASCADE"),
        nullable=False, unique=True, index=True,
    )
    attempt: Mapped[Attempt] = relationship(back_populates="evaluation")

    total_score: Mapped[int] = mapped_column(Integer, nullable=False)
    headline: Mapped[str] = mapped_column(String(200), nullable=False)
    summary: Mapped[str] = mapped_column(Text, nullable=False)

    scores: Mapped[list[dict]] = mapped_column(JSONB, nullable=False, server_default=text("'[]'::jsonb"))
    strengths: Mapped[list[dict]] = mapped_column(JSONB, nullable=False, server_default=text("'[]'::jsonb"))
    missed: Mapped[list[dict]] = mapped_column(JSONB, nullable=False, server_default=text("'[]'::jsonb"))
    safety_issues: Mapped[list[dict]] = mapped_column(JSONB, nullable=False, server_default=text("'[]'::jsonb"))
    timeline: Mapped[list[dict]] = mapped_column(JSONB, nullable=False, server_default=text("'[]'::jsonb"))
    better_approach: Mapped[list[str]] = mapped_column(JSONB, nullable=False, server_default=text("'[]'::jsonb"))

    next_scenario_slug: Mapped[str] = mapped_column(String(64), nullable=False)
    next_scenario_reason: Mapped[str] = mapped_column(Text, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
