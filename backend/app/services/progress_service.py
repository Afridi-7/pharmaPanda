"""
Progress aggregation.

One query joins a user's evaluated attempts to their reports, replacing the
per-report round trip the frontend used to make. Everything is derived from
stored evaluations, so progress cannot drift away from the reports behind it.
"""

from datetime import date, datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.engine.progress import (
    build_achievements,
    build_competencies,
    overall_score,
    practice_streak,
    weekly_activity,
)
from app.models.attempt import Attempt, Evaluation
from app.models.catalogue import Scenario
from app.models.user import User

# Cases suggested for the weakest competency.
TRAINING_MAP = {
    "counseling": "sc_inhaler",
    "communication": "sc_inhaler",
    "historyTaking": "sc_cough",
    "clinicalReasoning": "sc_wound",
    "medicationSafety": "sc_interaction",
    "referralDecisions": "sc_cough",
}


def _reports_for(db: Session, user: User) -> tuple[list[dict], list[datetime]]:
    """
    Every evaluated consultation, oldest first.

    A single join rather than one request per report — the N+1 this endpoint
    exists to remove.
    """
    rows = db.execute(
        select(Evaluation, Attempt, Scenario)
        .join(Attempt, Attempt.id == Evaluation.attempt_id)
        .join(Scenario, Scenario.id == Attempt.scenario_id)
        .where(Attempt.user_id == user.id)
        .order_by(Attempt.finished_at.asc().nullslast(), Attempt.started_at.asc())
    ).all()

    reports = [
        {
            "scores": list(evaluation.scores),
            "safetyIssues": list(evaluation.safety_issues),
            "totalScore": evaluation.total_score,
            "scenarioSlug": scenario.slug,
        }
        for evaluation, _attempt, scenario in rows
    ]
    finished = [
        attempt.finished_at or attempt.started_at for _evaluation, attempt, _scenario in rows
    ]
    return reports, finished


def competencies(db: Session, user: User) -> list[dict]:
    reports, _ = _reports_for(db, user)
    return build_competencies(reports)


def achievements(db: Session, user: User) -> list[dict]:
    reports, finished = _reports_for(db, user)
    return build_achievements(reports, finished)


def snapshot(db: Session, user: User, today: date | None = None) -> dict:
    """Everything the dashboard needs, in one round trip."""
    today = today or datetime.now(timezone.utc).date()
    reports, finished = _reports_for(db, user)

    competency_list = build_competencies(reports)
    weakest = min(competency_list, key=lambda c: c["score"])
    has_history = any(c["attempts"] > 0 for c in competency_list)

    return {
        "overallScore": overall_score(competency_list),
        "competencies": competency_list,
        "achievements": build_achievements(reports, finished),
        "weeklyActivity": weekly_activity(finished, today),
        "streakDays": practice_streak(finished, today),
        "consultationsCompleted": len(reports),
        "recommendedScenarioSlug": TRAINING_MAP.get(weakest["key"], "sc_inhaler"),
        "recommendationReason": (
            f"Your recent cases show that {weakest['label'].lower()} is your weakest competency."
            if has_history
            else "Start with a case that exercises history taking and medication safety."
        ),
    }
