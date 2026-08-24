"""
Consultation lifecycle.

Ported from the frontend `attemptService`, with the same call surface:
start / ask / save_notes / tick / recommend / counsel / refer / finish / abandon.

Every function takes the owning user and scopes its query by `user_id`, so one
student can never read or mutate another's consultation.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.engine import patient as patient_engine
from app.engine.evaluation import compute_evaluation
from app.engine.objectives import evaluate_objectives
from app.engine.patient import PatientEngineState
from app.models.attempt import Attempt, Evaluation
from app.models.catalogue import Patient, Scenario
from app.models.user import User


class NotFoundError(Exception):
    """The requested row does not exist, or does not belong to this user."""


class AttemptLockedError(Exception):
    """The consultation has been submitted and can no longer be changed."""


# --- Serialisation --------------------------------------------------------


def patient_to_dict(patient: Patient) -> dict:
    """Engine-shaped patient, using fact slugs as ids (the engines match on them)."""
    return {
        "id": patient.slug,
        "name": patient.name,
        "age": patient.age,
        "pronouns": patient.pronouns,
        "role": patient.role,
        "mood": patient.mood,
        "avatar": patient.avatar,
        "chiefComplaint": patient.chief_complaint,
        "openingLine": patient.opening_line,
        "deflections": list(patient.deflections),
        "impatientLines": list(patient.impatient_lines),
        "jargon": list(patient.jargon),
        "followUps": list(patient.follow_ups),
        "facts": [
            {
                "id": f.slug,
                "section": f.section,
                "label": f.label,
                "value": f.value,
                "revealedAtStart": f.revealed_at_start,
                "triggers": list(f.triggers),
                "patientLine": f.patient_line,
                "credits": f.credits,
                "safetyCritical": f.safety_critical,
            }
            for f in patient.facts
        ],
    }


def attempt_to_dict(attempt: Attempt, scenario_slug: str) -> dict:
    """Engine-shaped attempt."""
    return {
        "id": str(attempt.id),
        "scenarioId": scenario_slug,
        "status": attempt.status,
        "messages": list(attempt.messages),
        "actions": list(attempt.actions),
        "revealedFactIds": list(attempt.revealed_fact_ids),
        "notes": attempt.notes or "",
        "objectivesMet": list(attempt.objectives_met),
        "recommendation": (
            {"choice": attempt.recommendation_choice, "reasoning": attempt.recommendation_reasoning}
            if attempt.recommendation_choice
            else None
        ),
        "counseling": attempt.counseling,
        "referral": (
            {"choice": attempt.referral_choice, "reasoning": attempt.referral_reasoning}
            if attempt.referral_choice
            else None
        ),
    }


# --- Lookups --------------------------------------------------------------


def get_scenario(db: Session, slug: str) -> Scenario:
    scenario = db.execute(select(Scenario).where(Scenario.slug == slug)).scalar_one_or_none()
    if scenario is None:
        raise NotFoundError("simulation")
    return scenario


def list_scenarios(db: Session) -> list[Scenario]:
    return list(
        db.execute(select(Scenario).order_by(Scenario.position)).unique().scalars().all()
    )


def get_attempt(db: Session, attempt_id: uuid.UUID, user: User) -> Attempt:
    """Scoped by owner: another user's attempt is indistinguishable from a missing one."""
    attempt = db.execute(
        select(Attempt).where(Attempt.id == attempt_id, Attempt.user_id == user.id)
    ).scalar_one_or_none()
    if attempt is None:
        raise NotFoundError("consultation")
    return attempt


def _scenario_for(db: Session, attempt: Attempt) -> Scenario:
    scenario = db.get(Scenario, attempt.scenario_id)
    if scenario is None:  # pragma: no cover - FK makes this unreachable
        raise NotFoundError("simulation")
    return scenario


def _require_active(attempt: Attempt) -> None:
    if attempt.status != "in-progress":
        raise AttemptLockedError(attempt.status)


def _record_action(attempt: Attempt, action_type: str, content: str, **extra) -> dict:
    action = {
        "id": f"act_{uuid.uuid4().hex[:7]}",
        "type": action_type,
        "at": datetime.now(timezone.utc).isoformat(),
        "content": content,
        **extra,
    }
    # JSONB columns need a new list object to be seen as dirty.
    attempt.actions = [*attempt.actions, action]
    return action


def _refresh_objectives(attempt: Attempt, patient: Patient, scenario_slug: str) -> None:
    attempt.objectives_met = evaluate_objectives(
        attempt_to_dict(attempt, scenario_slug), patient_to_dict(patient)["facts"]
    )


# --- Lifecycle ------------------------------------------------------------


def start(db: Session, user: User, scenario_slug: str) -> Attempt:
    scenario = get_scenario(db, scenario_slug)
    patient = patient_to_dict(scenario.patient)

    attempt = Attempt(
        user_id=user.id,
        scenario_id=scenario.id,
        status="in-progress",
        messages=patient_engine.initial_messages(patient),
        actions=[],
        revealed_fact_ids=[f["id"] for f in patient_engine.starting_facts(patient)],
        objectives_met=[],
        notes="",
        duration_seconds=0,
    )
    db.add(attempt)
    db.commit()
    db.refresh(attempt)
    return attempt


def ask(db: Session, user: User, attempt_id: uuid.UUID, question: str) -> tuple[Attempt, list[dict], list[dict]]:
    attempt = get_attempt(db, attempt_id, user)
    _require_active(attempt)

    scenario = _scenario_for(db, attempt)
    patient = patient_to_dict(scenario.patient)
    trimmed = question.strip()

    previous_questions = [a for a in attempt.actions if a["type"] == "question"]
    streak = 0
    for action in reversed(previous_questions):
        if action.get("revealed"):
            break
        streak += 1

    turn = patient_engine.respond(
        patient,
        trimmed,
        PatientEngineState(
            revealed_fact_ids=list(attempt.revealed_fact_ids),
            question_count=len(previous_questions),
            unproductive_streak=streak,
            rapport_shown=any(m.get("tone") == "reassured" for m in attempt.messages),
        ),
    )

    revealed_ids = [f["id"] for f in turn.revealed]
    student_message = {
        "id": f"msg_{uuid.uuid4().hex[:7]}",
        "author": "student",
        "text": trimmed,
        "at": datetime.now(timezone.utc).isoformat(),
    }

    attempt.messages = [*attempt.messages, student_message, *turn.messages]
    attempt.revealed_fact_ids = list(dict.fromkeys([*attempt.revealed_fact_ids, *revealed_ids]))
    _record_action(attempt, "question", trimmed, revealed=revealed_ids)
    _refresh_objectives(attempt, scenario.patient, scenario.slug)

    db.commit()
    db.refresh(attempt)
    return attempt, [student_message, *turn.messages], turn.revealed


def save_notes(db: Session, user: User, attempt_id: uuid.UUID, notes: str) -> Attempt:
    attempt = get_attempt(db, attempt_id, user)
    _require_active(attempt)
    attempt.notes = notes
    db.commit()
    db.refresh(attempt)
    return attempt


def tick(db: Session, user: User, attempt_id: uuid.UUID, seconds: int) -> Attempt:
    attempt = get_attempt(db, attempt_id, user)
    if attempt.status == "in-progress":
        attempt.duration_seconds = seconds
        db.commit()
        db.refresh(attempt)
    return attempt


def recommend(
    db: Session, user: User, attempt_id: uuid.UUID, choice: str, reasoning: str
) -> tuple[Attempt, list[dict]]:
    attempt = get_attempt(db, attempt_id, user)
    _require_active(attempt)
    scenario = _scenario_for(db, attempt)
    patient = patient_to_dict(scenario.patient)

    now = datetime.now(timezone.utc).isoformat()
    system_message = {
        "id": f"msg_{uuid.uuid4().hex[:7]}", "author": "system",
        "text": f"You recommended: {choice}.", "at": now, "tone": "neutral",
    }

    combined = f"{choice} {reasoning}".lower()
    follow_up = next(
        (f for f in patient["followUps"] if any(t.lower() in combined for t in f["triggers"])),
        None,
    )
    patient_messages = [{
        "id": f"msg_{uuid.uuid4().hex[:7]}", "author": "patient",
        "text": follow_up["line"] if follow_up else "Right — so what should I actually do, then?",
        "at": now, "tone": "concerned" if follow_up else "neutral",
    }]

    attempt.recommendation_choice = choice
    attempt.recommendation_reasoning = reasoning
    attempt.messages = [*attempt.messages, system_message, *patient_messages]
    _record_action(attempt, "recommendation", reasoning, choice=choice)
    _refresh_objectives(attempt, scenario.patient, scenario.slug)

    db.commit()
    db.refresh(attempt)
    return attempt, [system_message, *patient_messages]


def counsel(db: Session, user: User, attempt_id: uuid.UUID, script: str) -> tuple[Attempt, list[dict]]:
    attempt = get_attempt(db, attempt_id, user)
    _require_active(attempt)
    scenario = _scenario_for(db, attempt)
    patient = patient_to_dict(scenario.patient)

    now = datetime.now(timezone.utc).isoformat()
    used_jargon = next((j for j in patient["jargon"] if j.lower() in script.lower()), None)

    messages = [
        {"id": f"msg_{uuid.uuid4().hex[:7]}", "author": "student", "text": script.strip(), "at": now},
        {
            "id": f"msg_{uuid.uuid4().hex[:7]}", "author": "patient", "at": now,
            "text": (
                f"Sorry, most of that made sense — but what does “{used_jargon}” mean?"
                if used_jargon
                else "That is clear, thank you. I think I know what I am doing now."
            ),
            "tone": "confused" if used_jargon else "reassured",
        },
    ]

    attempt.counseling = script
    attempt.messages = [*attempt.messages, *messages]
    _record_action(attempt, "counseling", script)
    _refresh_objectives(attempt, scenario.patient, scenario.slug)

    db.commit()
    db.refresh(attempt)
    return attempt, messages


def refer(
    db: Session, user: User, attempt_id: uuid.UUID, choice: str, reasoning: str
) -> tuple[Attempt, list[dict]]:
    attempt = get_attempt(db, attempt_id, user)
    _require_active(attempt)
    scenario = _scenario_for(db, attempt)

    now = datetime.now(timezone.utc).isoformat()
    messages = [{
        "id": f"msg_{uuid.uuid4().hex[:7]}", "author": "system",
        "text": f"Referral decision recorded: {choice}.", "at": now,
        "tone": "neutral" if choice == "No referral" else "concerned",
    }]
    if choice != "No referral":
        messages.append({
            "id": f"msg_{uuid.uuid4().hex[:7]}", "author": "patient",
            "text": "All right. Where exactly do I go, and how soon?", "at": now, "tone": "concerned",
        })

    attempt.referral_choice = choice
    attempt.referral_reasoning = reasoning
    attempt.messages = [*attempt.messages, *messages]
    _record_action(attempt, "referral", reasoning, choice=choice)
    _refresh_objectives(attempt, scenario.patient, scenario.slug)

    db.commit()
    db.refresh(attempt)
    return attempt, messages


def finish(db: Session, user: User, attempt_id: uuid.UUID, duration_seconds: int) -> Attempt:
    attempt = get_attempt(db, attempt_id, user)
    _require_active(attempt)

    attempt.status = "submitted"
    attempt.finished_at = datetime.now(timezone.utc)
    attempt.duration_seconds = duration_seconds
    _record_action(attempt, "finish", "Consultation submitted for evaluation.")

    db.commit()
    db.refresh(attempt)
    return attempt


def abandon(db: Session, user: User, attempt_id: uuid.UUID) -> Attempt:
    attempt = get_attempt(db, attempt_id, user)
    if attempt.status == "in-progress":
        attempt.status = "abandoned"
        db.commit()
        db.refresh(attempt)
    return attempt


# --- Evaluation -----------------------------------------------------------


def evaluate(db: Session, user: User, attempt_id: uuid.UUID) -> Evaluation:
    """
    Score a submitted attempt and persist the report.

    Idempotent: re-running returns the stored evaluation rather than rescoring,
    so a retried request cannot produce a second, different grade.
    """
    attempt = get_attempt(db, attempt_id, user)

    if attempt.evaluation is not None:
        return attempt.evaluation

    scenario = _scenario_for(db, attempt)
    report = compute_evaluation(
        attempt_to_dict(attempt, scenario.slug),
        {"slug": scenario.slug, "title": scenario.title},
        patient_to_dict(scenario.patient),
    )

    evaluation = Evaluation(
        attempt_id=attempt.id,
        total_score=report["totalScore"],
        headline=report["headline"],
        summary=report["summary"],
        scores=report["scores"],
        strengths=report["strengths"],
        missed=report["missed"],
        safety_issues=report["safetyIssues"],
        timeline=report["timeline"],
        better_approach=report["betterApproach"],
        next_scenario_slug=report["nextScenarioId"],
        next_scenario_reason=report["nextScenarioReason"],
    )
    db.add(evaluation)

    attempt.status = "evaluated"
    attempt.score = report["totalScore"]

    db.commit()
    db.refresh(evaluation)
    return evaluation


def get_evaluation(db: Session, user: User, attempt_id: uuid.UUID) -> Evaluation:
    attempt = get_attempt(db, attempt_id, user)
    if attempt.evaluation is None:
        raise NotFoundError("report")
    return attempt.evaluation


def list_attempts(db: Session, user: User) -> list[Attempt]:
    return list(
        db.execute(
            select(Attempt)
            .where(Attempt.user_id == user.id)
            .order_by(Attempt.started_at.desc())
        )
        .scalars()
        .all()
    )
