"""
Scenario and attempt schemas.

camelCase at the boundary, matching the existing React types so the frontend
cutover does not require type changes.
"""

import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel

RecommendationOption = Literal[
    "Paracetamol",
    "NSAID",
    "Non-drug management",
    "No OTC treatment",
    "Routine physician referral",
    "Urgent referral",
    "Other",
]

ReferralOption = Literal[
    "No referral",
    "Routine physician referral",
    "Urgent referral",
    "Emergency referral",
]

CompletionStatus = Literal["not-started", "in-progress", "completed"]


class CamelModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel, populate_by_name=True, from_attributes=True
    )


# --- Catalogue ------------------------------------------------------------


class PatientFactResponse(CamelModel):
    """
    A disclosed fact.

    Only ever built for facts the student has actually uncovered — the hidden
    ones are filtered out server-side, so undiscovered clinical detail never
    reaches the browser at all.
    """

    id: str
    section: str
    label: str
    value: str
    revealed_at_start: bool
    credits: str
    safety_critical: bool = False


class PatientResponse(CamelModel):
    """Patient profile with only the facts revealed so far."""

    id: str
    name: str
    age: int
    pronouns: str
    role: str
    mood: str
    avatar: str
    chief_complaint: str
    facts: list[PatientFactResponse]


class ScenarioResponse(CamelModel):
    id: str
    title: str
    tagline: str
    description: str
    mission: str
    category: str
    setting: str
    difficulty: str
    duration_minutes: tuple[int, int]
    skills: list[str]
    objectives: list[str]
    patient_id: str
    # Per-user progress, resolved from the caller's own attempts.
    status: CompletionStatus = "not-started"
    previous_score: int | None = None
    last_attempt_id: str | None = None


# --- Attempts -------------------------------------------------------------


class ConversationMessageResponse(CamelModel):
    id: str
    author: Literal["student", "patient", "system"]
    text: str
    at: str
    revealed: list[str] | None = None
    tone: str | None = None


class StudentActionResponse(CamelModel):
    id: str
    type: str
    at: str
    content: str
    choice: str | None = None
    revealed: list[str] | None = None


class DecisionResponse(CamelModel):
    choice: str
    reasoning: str


class AttemptResponse(CamelModel):
    id: uuid.UUID
    scenario_id: str
    user_id: uuid.UUID
    status: str
    started_at: datetime
    finished_at: datetime | None = None
    duration_seconds: int
    messages: list[ConversationMessageResponse]
    actions: list[StudentActionResponse]
    revealed_fact_ids: list[str]
    notes: str
    objectives_met: list[str]
    recommendation: DecisionResponse | None = None
    counseling: str | None = None
    referral: DecisionResponse | None = None
    evaluation_id: uuid.UUID | None = None
    score: int | None = None


class AskResultResponse(CamelModel):
    """An attempt plus just the turn it produced, so the UI can animate it."""

    attempt: AttemptResponse
    messages: list[ConversationMessageResponse]
    revealed: list[PatientFactResponse]


class StartAttemptRequest(CamelModel):
    scenario_id: str


class AskRequest(CamelModel):
    question: str = Field(min_length=1, max_length=2000)


class NotesRequest(CamelModel):
    notes: str = Field(default="", max_length=20000)


class TickRequest(CamelModel):
    duration_seconds: int = Field(ge=0, le=60 * 60 * 12)


class RecommendRequest(CamelModel):
    choice: RecommendationOption
    reasoning: str = Field(min_length=1, max_length=5000)


class CounselRequest(CamelModel):
    script: str = Field(min_length=1, max_length=5000)


class ReferRequest(CamelModel):
    choice: ReferralOption
    reasoning: str = Field(min_length=1, max_length=5000)


class FinishRequest(CamelModel):
    duration_seconds: int = Field(default=0, ge=0, le=60 * 60 * 12)


# --- Evaluation -----------------------------------------------------------


class EvaluationResponse(CamelModel):
    id: uuid.UUID
    attempt_id: uuid.UUID
    scenario_id: str
    scenario_title: str
    total_score: int
    headline: str
    # Kept as `pandaMessage` at the boundary: the React `Evaluation` type still
    # names it that, and renaming is a separate frontend change.
    panda_message: str
    scores: list[dict]
    strengths: list[dict]
    missed: list[dict]
    safety_issues: list[dict]
    timeline: list[dict]
    better_approach: list[str]
    next_scenario_id: str
    next_scenario_reason: str
    created_at: datetime


class ObjectiveResponse(CamelModel):
    id: str
    label: str
    hint: str


class AttemptSummaryResponse(CamelModel):
    attempt_id: uuid.UUID
    scenario_id: str
    scenario_title: str
    category: str
    score: int
    date: datetime
    duration_label: str
    status: Literal["Completed", "Needs review", "Abandoned"]


# --- Progress -------------------------------------------------------------


class CompetencyResponse(CamelModel):
    key: str
    label: str
    description: str
    score: int
    previous_score: int
    attempts: int
    trend_label: str
    history: list[dict]
    focus_areas: list[str]


class AchievementProgress(CamelModel):
    current: int
    target: int


class AchievementResponse(CamelModel):
    id: str
    title: str
    description: str
    icon: str
    unlocked: bool
    progress: AchievementProgress | None = None


class WeeklyActivityEntry(CamelModel):
    label: str
    consultations: int


class ProgressResponse(CamelModel):
    """Everything the dashboard and progress views need, in one response."""

    overall_score: int
    competencies: list[CompetencyResponse]
    achievements: list[AchievementResponse]
    weekly_activity: list[WeeklyActivityEntry]
    streak_days: int
    consultations_completed: int
    recommended_scenario_slug: str
    recommendation_reason: str
