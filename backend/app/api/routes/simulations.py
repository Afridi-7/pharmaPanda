import uuid

from fastapi import APIRouter, HTTPException, status

from app.api.deps import CurrentUser, DbSession
from app.engine.evaluation import EVALUATION_STAGES
from app.engine.objectives import CONSULTATION_OBJECTIVES
from app.models.attempt import Attempt, Evaluation
from app.models.catalogue import Patient, Scenario
from app.schemas.simulation import (
    AskRequest,
    AskResultResponse,
    AttemptResponse,
    AttemptSummaryResponse,
    CounselRequest,
    EvaluationResponse,
    FinishRequest,
    NotesRequest,
    ObjectiveResponse,
    PatientResponse,
    RecommendRequest,
    ReferRequest,
    ScenarioResponse,
    StartAttemptRequest,
    TickRequest,
)
from app.services import attempt_service
from app.services.attempt_service import AttemptLockedError, NotFoundError

router = APIRouter(tags=["simulations"])


def _not_found(what: str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_404_NOT_FOUND, detail=f"We couldn't find that {what}."
    )


LOCKED = HTTPException(
    status_code=status.HTTP_409_CONFLICT,
    detail="This consultation has been submitted and can no longer be changed.",
)


# --- Builders -------------------------------------------------------------


def _scenario_response(scenario: Scenario, attempts: list[Attempt]) -> ScenarioResponse:
    """Catalogue row plus this user's own progress on it."""
    mine = [a for a in attempts if a.scenario_id == scenario.id]
    evaluated = [a for a in mine if a.status == "evaluated"]

    if evaluated:
        latest = max(evaluated, key=lambda a: a.started_at)
        progress_status, previous_score, last_attempt = "completed", latest.score, str(latest.id)
    elif any(a.status == "in-progress" for a in mine):
        progress_status, previous_score, last_attempt = "in-progress", None, None
    else:
        progress_status, previous_score, last_attempt = "not-started", None, None

    return ScenarioResponse(
        id=scenario.slug,
        title=scenario.title,
        tagline=scenario.tagline,
        description=scenario.description,
        mission=scenario.mission,
        category=scenario.category,
        setting=scenario.setting,
        difficulty=scenario.difficulty,
        duration_minutes=(scenario.duration_min, scenario.duration_max),
        skills=list(scenario.skills),
        objectives=list(scenario.objectives),
        patient_id=scenario.patient.slug,
        status=progress_status,
        previous_score=previous_score,
        last_attempt_id=last_attempt,
    )


def _patient_response(patient: Patient, revealed_ids: list[str]) -> PatientResponse:
    """
    Only revealed facts are serialised.

    This is the discovery mechanic's real enforcement point: undiscovered facts
    never leave the server, so they cannot be read out of a network response.
    """
    return PatientResponse(
        id=patient.slug,
        name=patient.name,
        age=patient.age,
        pronouns=patient.pronouns,
        role=patient.role,
        mood=patient.mood,
        avatar=patient.avatar,
        chief_complaint=patient.chief_complaint,
        facts=[
            {
                "id": f.slug,
                "section": f.section,
                "label": f.label,
                "value": f.value,
                "revealedAtStart": f.revealed_at_start,
                "credits": f.credits,
                "safetyCritical": f.safety_critical,
            }
            for f in patient.facts
            if f.slug in revealed_ids
        ],
    )


def _attempt_response(attempt: Attempt, scenario_slug: str) -> AttemptResponse:
    return AttemptResponse(
        id=attempt.id,
        scenario_id=scenario_slug,
        user_id=attempt.user_id,
        status=attempt.status,
        started_at=attempt.started_at,
        finished_at=attempt.finished_at,
        duration_seconds=attempt.duration_seconds,
        messages=list(attempt.messages),
        actions=list(attempt.actions),
        revealed_fact_ids=list(attempt.revealed_fact_ids),
        notes=attempt.notes or "",
        objectives_met=list(attempt.objectives_met),
        recommendation=(
            {"choice": attempt.recommendation_choice, "reasoning": attempt.recommendation_reasoning}
            if attempt.recommendation_choice
            else None
        ),
        counseling=attempt.counseling,
        referral=(
            {"choice": attempt.referral_choice, "reasoning": attempt.referral_reasoning}
            if attempt.referral_choice
            else None
        ),
        evaluation_id=attempt.evaluation.id if attempt.evaluation else None,
        score=attempt.score,
    )


def _evaluation_response(evaluation: Evaluation, scenario: Scenario) -> EvaluationResponse:
    return EvaluationResponse(
        id=evaluation.id,
        attempt_id=evaluation.attempt_id,
        scenario_id=scenario.slug,
        scenario_title=scenario.title,
        total_score=evaluation.total_score,
        headline=evaluation.headline,
        panda_message=evaluation.summary,
        scores=list(evaluation.scores),
        strengths=list(evaluation.strengths),
        missed=list(evaluation.missed),
        safety_issues=list(evaluation.safety_issues),
        timeline=list(evaluation.timeline),
        better_approach=list(evaluation.better_approach),
        next_scenario_id=evaluation.next_scenario_slug,
        next_scenario_reason=evaluation.next_scenario_reason,
        created_at=evaluation.created_at,
    )


def _resolve(attempt_id: str) -> uuid.UUID:
    try:
        return uuid.UUID(attempt_id)
    except ValueError:
        raise _not_found("consultation") from None


# --- Catalogue ------------------------------------------------------------


@router.get("/scenarios", response_model=list[ScenarioResponse], summary="List simulations")
def list_scenarios(current_user: CurrentUser, db: DbSession) -> list[ScenarioResponse]:
    attempts = attempt_service.list_attempts(db, current_user)
    return [_scenario_response(s, attempts) for s in attempt_service.list_scenarios(db)]


@router.get("/scenarios/{slug}", response_model=ScenarioResponse, summary="Get a simulation")
def get_scenario(slug: str, current_user: CurrentUser, db: DbSession) -> ScenarioResponse:
    try:
        scenario = attempt_service.get_scenario(db, slug)
    except NotFoundError as exc:
        raise _not_found(str(exc)) from None
    return _scenario_response(scenario, attempt_service.list_attempts(db, current_user))


@router.get("/objectives", response_model=list[ObjectiveResponse], summary="Consultation objectives")
def list_objectives() -> list[ObjectiveResponse]:
    return [ObjectiveResponse(**o) for o in CONSULTATION_OBJECTIVES]


@router.get("/evaluation-stages", response_model=list[str], summary="Evaluation stage names")
def evaluation_stages() -> list[str]:
    return EVALUATION_STAGES


# --- Attempts -------------------------------------------------------------


@router.post(
    "/attempts",
    response_model=AttemptResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Start a consultation",
)
def start_attempt(
    payload: StartAttemptRequest, current_user: CurrentUser, db: DbSession
) -> AttemptResponse:
    try:
        attempt = attempt_service.start(db, current_user, payload.scenario_id)
    except NotFoundError as exc:
        raise _not_found(str(exc)) from None
    return _attempt_response(attempt, payload.scenario_id)


@router.get("/attempts", response_model=list[AttemptSummaryResponse], summary="Consultation history")
def list_history(current_user: CurrentUser, db: DbSession) -> list[AttemptSummaryResponse]:
    rows: list[AttemptSummaryResponse] = []
    for attempt in attempt_service.list_attempts(db, current_user):
        if attempt.status not in {"evaluated", "abandoned"}:
            continue
        scenario = db.get(Scenario, attempt.scenario_id)
        if scenario is None:  # pragma: no cover
            continue
        score = attempt.score or 0
        rows.append(
            AttemptSummaryResponse(
                attempt_id=attempt.id,
                scenario_id=scenario.slug,
                scenario_title=scenario.title,
                category=scenario.category,
                score=score,
                date=attempt.finished_at or attempt.started_at,
                duration_label=f"{max(1, round(attempt.duration_seconds / 60))} min",
                status=(
                    "Abandoned"
                    if attempt.status == "abandoned"
                    else ("Needs review" if score < 75 else "Completed")
                ),
            )
        )
    return rows


@router.get("/attempts/{attempt_id}", response_model=AttemptResponse, summary="Get a consultation")
def get_attempt(attempt_id: str, current_user: CurrentUser, db: DbSession) -> AttemptResponse:
    try:
        attempt = attempt_service.get_attempt(db, _resolve(attempt_id), current_user)
    except NotFoundError as exc:
        raise _not_found(str(exc)) from None
    scenario = db.get(Scenario, attempt.scenario_id)
    return _attempt_response(attempt, scenario.slug if scenario else "")


@router.get(
    "/attempts/{attempt_id}/patient",
    response_model=PatientResponse,
    summary="Patient, with only the facts discovered so far",
)
def get_attempt_patient(attempt_id: str, current_user: CurrentUser, db: DbSession) -> PatientResponse:
    try:
        attempt = attempt_service.get_attempt(db, _resolve(attempt_id), current_user)
    except NotFoundError as exc:
        raise _not_found(str(exc)) from None
    scenario = db.get(Scenario, attempt.scenario_id)
    return _patient_response(scenario.patient, list(attempt.revealed_fact_ids))


def _ask_result(db, attempt, messages, revealed) -> AskResultResponse:
    scenario = db.get(Scenario, attempt.scenario_id)
    return AskResultResponse(
        attempt=_attempt_response(attempt, scenario.slug if scenario else ""),
        messages=messages,
        revealed=[
            {
                "id": f["id"], "section": f["section"], "label": f["label"], "value": f["value"],
                "revealedAtStart": f["revealedAtStart"], "credits": f["credits"],
                "safetyCritical": f.get("safetyCritical", False),
            }
            for f in revealed
        ],
    )


@router.post(
    "/attempts/{attempt_id}/messages",
    response_model=AskResultResponse,
    summary="Ask the patient a question",
)
def ask(
    attempt_id: str, payload: AskRequest, current_user: CurrentUser, db: DbSession
) -> AskResultResponse:
    try:
        attempt, messages, revealed = attempt_service.ask(
            db, current_user, _resolve(attempt_id), payload.question
        )
    except NotFoundError as exc:
        raise _not_found(str(exc)) from None
    except AttemptLockedError:
        raise LOCKED from None
    return _ask_result(db, attempt, messages, revealed)


@router.patch("/attempts/{attempt_id}/notes", response_model=AttemptResponse, summary="Save notes")
def save_notes(
    attempt_id: str, payload: NotesRequest, current_user: CurrentUser, db: DbSession
) -> AttemptResponse:
    try:
        attempt = attempt_service.save_notes(db, current_user, _resolve(attempt_id), payload.notes)
    except NotFoundError as exc:
        raise _not_found(str(exc)) from None
    except AttemptLockedError:
        raise LOCKED from None
    scenario = db.get(Scenario, attempt.scenario_id)
    return _attempt_response(attempt, scenario.slug if scenario else "")


@router.patch("/attempts/{attempt_id}/duration", response_model=AttemptResponse, summary="Persist elapsed time")
def tick(
    attempt_id: str, payload: TickRequest, current_user: CurrentUser, db: DbSession
) -> AttemptResponse:
    try:
        attempt = attempt_service.tick(
            db, current_user, _resolve(attempt_id), payload.duration_seconds
        )
    except NotFoundError as exc:
        raise _not_found(str(exc)) from None
    scenario = db.get(Scenario, attempt.scenario_id)
    return _attempt_response(attempt, scenario.slug if scenario else "")


@router.post(
    "/attempts/{attempt_id}/recommendation",
    response_model=AskResultResponse,
    summary="Record a recommendation",
)
def recommend(
    attempt_id: str, payload: RecommendRequest, current_user: CurrentUser, db: DbSession
) -> AskResultResponse:
    try:
        attempt, messages = attempt_service.recommend(
            db, current_user, _resolve(attempt_id), payload.choice, payload.reasoning
        )
    except NotFoundError as exc:
        raise _not_found(str(exc)) from None
    except AttemptLockedError:
        raise LOCKED from None
    return _ask_result(db, attempt, messages, [])


@router.post(
    "/attempts/{attempt_id}/counseling",
    response_model=AskResultResponse,
    summary="Record counselling",
)
def counsel(
    attempt_id: str, payload: CounselRequest, current_user: CurrentUser, db: DbSession
) -> AskResultResponse:
    try:
        attempt, messages = attempt_service.counsel(
            db, current_user, _resolve(attempt_id), payload.script
        )
    except NotFoundError as exc:
        raise _not_found(str(exc)) from None
    except AttemptLockedError:
        raise LOCKED from None
    return _ask_result(db, attempt, messages, [])


@router.post(
    "/attempts/{attempt_id}/referral",
    response_model=AskResultResponse,
    summary="Record a referral decision",
)
def refer(
    attempt_id: str, payload: ReferRequest, current_user: CurrentUser, db: DbSession
) -> AskResultResponse:
    try:
        attempt, messages = attempt_service.refer(
            db, current_user, _resolve(attempt_id), payload.choice, payload.reasoning
        )
    except NotFoundError as exc:
        raise _not_found(str(exc)) from None
    except AttemptLockedError:
        raise LOCKED from None
    return _ask_result(db, attempt, messages, [])


@router.post("/attempts/{attempt_id}/finish", response_model=AttemptResponse, summary="Submit for evaluation")
def finish(
    attempt_id: str, payload: FinishRequest, current_user: CurrentUser, db: DbSession
) -> AttemptResponse:
    try:
        attempt = attempt_service.finish(
            db, current_user, _resolve(attempt_id), payload.duration_seconds
        )
    except NotFoundError as exc:
        raise _not_found(str(exc)) from None
    except AttemptLockedError:
        raise LOCKED from None
    scenario = db.get(Scenario, attempt.scenario_id)
    return _attempt_response(attempt, scenario.slug if scenario else "")


@router.post("/attempts/{attempt_id}/abandon", response_model=AttemptResponse, summary="Abandon")
def abandon(attempt_id: str, current_user: CurrentUser, db: DbSession) -> AttemptResponse:
    try:
        attempt = attempt_service.abandon(db, current_user, _resolve(attempt_id))
    except NotFoundError as exc:
        raise _not_found(str(exc)) from None
    scenario = db.get(Scenario, attempt.scenario_id)
    return _attempt_response(attempt, scenario.slug if scenario else "")


# --- Evaluation -----------------------------------------------------------


@router.post(
    "/attempts/{attempt_id}/evaluate",
    response_model=EvaluationResponse,
    summary="Score a submitted consultation",
)
def evaluate(attempt_id: str, current_user: CurrentUser, db: DbSession) -> EvaluationResponse:
    try:
        evaluation = attempt_service.evaluate(db, current_user, _resolve(attempt_id))
    except NotFoundError as exc:
        raise _not_found(str(exc)) from None
    scenario = db.get(Scenario, evaluation.attempt.scenario_id)
    return _evaluation_response(evaluation, scenario)


@router.get(
    "/attempts/{attempt_id}/evaluation",
    response_model=EvaluationResponse,
    summary="Get the report for a consultation",
)
def get_evaluation(attempt_id: str, current_user: CurrentUser, db: DbSession) -> EvaluationResponse:
    try:
        evaluation = attempt_service.get_evaluation(db, current_user, _resolve(attempt_id))
    except NotFoundError as exc:
        raise _not_found(str(exc)) from None
    scenario = db.get(Scenario, evaluation.attempt.scenario_id)
    return _evaluation_response(evaluation, scenario)
