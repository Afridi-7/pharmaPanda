from fastapi import APIRouter

from app.api.deps import CurrentUser, DbSession
from app.schemas.simulation import (
    AchievementResponse,
    CompetencyResponse,
    ProgressResponse,
)
from app.services import progress_service

router = APIRouter(prefix="/progress", tags=["progress"])


@router.get("", response_model=ProgressResponse, summary="Competencies, achievements and activity")
def get_progress(current_user: CurrentUser, db: DbSession) -> ProgressResponse:
    """
    One round trip for the whole dashboard.

    Replaces the frontend's per-report fetch: competency aggregation and
    achievement rules now run against a single joined query.
    """
    return ProgressResponse(**progress_service.snapshot(db, current_user))


@router.get("/competencies", response_model=list[CompetencyResponse], summary="Competency detail")
def get_competencies(current_user: CurrentUser, db: DbSession) -> list[CompetencyResponse]:
    return [CompetencyResponse(**c) for c in progress_service.competencies(db, current_user)]


@router.get("/achievements", response_model=list[AchievementResponse], summary="Achievements")
def get_achievements(current_user: CurrentUser, db: DbSession) -> list[AchievementResponse]:
    return [AchievementResponse(**a) for a in progress_service.achievements(db, current_user)]
