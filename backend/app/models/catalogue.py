import uuid

from sqlalchemy import Boolean, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Scenario(Base):
    """
    Authored course content, not user data.

    Rows are loaded by `scripts/seed_catalogue.py` from the same definitions the
    frontend used, and are identical for every student. `slug` keeps the stable
    public identifier (`sc_headache`) that scenario rules and links depend on.
    """

    __tablename__ = "scenarios"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    slug: Mapped[str] = mapped_column(String(64), nullable=False, unique=True, index=True)

    title: Mapped[str] = mapped_column(String(200), nullable=False)
    tagline: Mapped[str] = mapped_column(String(300), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    mission: Mapped[str] = mapped_column(Text, nullable=False)

    category: Mapped[str] = mapped_column(String(64), nullable=False)
    setting: Mapped[str] = mapped_column(String(64), nullable=False)
    difficulty: Mapped[str] = mapped_column(String(32), nullable=False)

    duration_min: Mapped[int] = mapped_column(Integer, nullable=False)
    duration_max: Mapped[int] = mapped_column(Integer, nullable=False)

    skills: Mapped[list[str]] = mapped_column(JSONB, nullable=False, default=list)
    objectives: Mapped[list[str]] = mapped_column(JSONB, nullable=False, default=list)

    # Display order in the simulation library.
    position: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    patient_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("patients.id", ondelete="RESTRICT"), nullable=False
    )
    patient: Mapped["Patient"] = relationship(back_populates="scenarios", lazy="joined")


class Patient(Base):
    """A simulated patient. Also catalogue content."""

    __tablename__ = "patients"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    slug: Mapped[str] = mapped_column(String(64), nullable=False, unique=True, index=True)

    name: Mapped[str] = mapped_column(String(120), nullable=False)
    age: Mapped[int] = mapped_column(Integer, nullable=False)
    pronouns: Mapped[str] = mapped_column(String(32), nullable=False)
    role: Mapped[str] = mapped_column(String(64), nullable=False)
    mood: Mapped[str] = mapped_column(String(32), nullable=False)
    avatar: Mapped[str] = mapped_column(String(32), nullable=False)

    chief_complaint: Mapped[str] = mapped_column(String(200), nullable=False)
    opening_line: Mapped[str] = mapped_column(Text, nullable=False)

    # Short string lists the patient engine reads whole; no relational queries.
    deflections: Mapped[list[str]] = mapped_column(JSONB, nullable=False, default=list)
    impatient_lines: Mapped[list[str]] = mapped_column(JSONB, nullable=False, default=list)
    jargon: Mapped[list[str]] = mapped_column(JSONB, nullable=False, default=list)
    follow_ups: Mapped[list[dict]] = mapped_column(JSONB, nullable=False, default=list)

    facts: Mapped[list["PatientFact"]] = relationship(
        back_populates="patient",
        cascade="all, delete-orphan",
        order_by="PatientFact.position",
        lazy="selectin",
    )
    scenarios: Mapped[list[Scenario]] = relationship(back_populates="patient")


class PatientFact(Base):
    """
    One disclosable detail.

    A real table rather than JSON on the patient: facts are referenced
    individually by `attempts.revealed_fact_ids` and by the evaluation rules,
    so they need stable identity of their own.
    """

    __tablename__ = "patient_facts"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    slug: Mapped[str] = mapped_column(String(64), nullable=False, unique=True, index=True)

    patient_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("patients.id", ondelete="CASCADE"), nullable=False, index=True
    )
    patient: Mapped[Patient] = relationship(back_populates="facts")

    section: Mapped[str] = mapped_column(String(32), nullable=False)
    label: Mapped[str] = mapped_column(String(120), nullable=False)
    value: Mapped[str] = mapped_column(Text, nullable=False)

    revealed_at_start: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    triggers: Mapped[list[str]] = mapped_column(JSONB, nullable=False, default=list)
    patient_line: Mapped[str] = mapped_column(Text, nullable=False)
    credits: Mapped[str] = mapped_column(String(32), nullable=False)
    safety_critical: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    position: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
