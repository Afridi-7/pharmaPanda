"""
Progress aggregation tests.

Competency maths and achievement rules are new logic rather than a port, so
they are pinned directly against synthetic reports, then again end to end
through the API.
"""

from datetime import date, datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient

from app.core.config import settings
from app.engine.progress import (
    build_achievements,
    build_competencies,
    overall_score,
    practice_streak,
    weekly_activity,
)
from tests.conftest import requires_postgres

PREFIX = settings.API_PREFIX
KEYS = [
    "historyTaking", "clinicalReasoning", "medicationSafety",
    "counseling", "communication", "referralDecisions",
]


def _report(score: int = 70, *, critical: bool = False, slug: str = "sc_headache", **overrides) -> dict:
    """A synthetic evaluation: every competency at `score` unless overridden."""
    scores = [{"key": k, "label": k, "score": overrides.get(k, score)} for k in KEYS]
    return {
        "scores": scores,
        "safetyIssues": (
            [{"id": "si", "severity": "critical", "title": "x", "what": "y", "why": "z"}]
            if critical
            else []
        ),
        "totalScore": score,
        "scenarioSlug": slug,
    }


# --- Competency aggregation ------------------------------------------------


def test_no_reports_gives_zeroed_competencies() -> None:
    competencies = build_competencies([])
    assert len(competencies) == 6
    assert all(c["score"] == 0 and c["attempts"] == 0 for c in competencies)
    assert all(c["trendLabel"] == "No attempts yet" for c in competencies)
    assert all(c["history"] == [] for c in competencies)
    # Descriptions and focus areas are course content and must survive.
    assert all(c["description"] and c["focusAreas"] for c in competencies)


def test_score_reflects_most_recent_attempt_not_average() -> None:
    """A student who improved should see their current standard."""
    competencies = build_competencies([_report(40), _report(90)])
    assert all(c["score"] == 90 for c in competencies)
    assert all(c["previousScore"] == 40 for c in competencies)


def test_trend_label_reports_change_since_last_case() -> None:
    up = build_competencies([_report(60), _report(75)])[0]
    assert up["trendLabel"] == "+15% since last case"

    down = build_competencies([_report(75), _report(60)])[0]
    assert down["trendLabel"] == "-15% since last case"

    flat = build_competencies([_report(70), _report(70)])[0]
    assert flat["trendLabel"] == "No change since last case"


def test_first_attempt_is_labelled_as_such() -> None:
    competency = build_competencies([_report(70)])[0]
    assert competency["trendLabel"] == "First attempt"
    assert competency["previousScore"] == competency["score"]
    assert competency["attempts"] == 1


def test_history_is_oldest_first_and_capped() -> None:
    competencies = build_competencies([_report(50 + i) for i in range(12)])
    history = competencies[0]["history"]
    assert len(history) == 8
    assert [h["score"] for h in history] == list(range(54, 62))


def test_overall_score_is_zero_without_attempts() -> None:
    assert overall_score(build_competencies([])) == 0


def test_overall_score_averages_current_competencies() -> None:
    assert overall_score(build_competencies([_report(80)])) == 80


# --- Achievements ----------------------------------------------------------


def test_nothing_unlocked_without_consultations() -> None:
    achievements = build_achievements([], [])
    assert len(achievements) == 6
    assert all(not a["unlocked"] for a in achievements)


def test_first_patient_unlocks_on_first_report() -> None:
    achievements = build_achievements([_report()], [datetime.now(timezone.utc)])
    assert next(a for a in achievements if a["id"] == "ach_first_patient")["unlocked"]


def test_safe_hands_needs_five_consecutive_clean_consultations() -> None:
    four = build_achievements([_report() for _ in range(4)], [])
    assert not next(a for a in four if a["id"] == "ach_safe_hands")["unlocked"]

    five = build_achievements([_report() for _ in range(5)], [])
    assert next(a for a in five if a["id"] == "ach_safe_hands")["unlocked"]


def test_safe_hands_run_resets_after_a_critical_issue() -> None:
    reports = [_report(), _report(), _report(critical=True), _report(), _report()]
    achievement = next(
        a for a in build_achievements(reports, []) if a["id"] == "ach_safe_hands"
    )
    assert not achievement["unlocked"]
    assert achievement["progress"]["current"] == 2  # only the run after the issue


def test_clinical_thinker_needs_three_distinct_cases() -> None:
    """Three strong scores on the *same* case must not unlock it."""
    same_case = [_report(slug="sc_headache", clinicalReasoning=90) for _ in range(3)]
    assert not next(
        a for a in build_achievements(same_case, []) if a["id"] == "ach_clinical_thinker"
    )["unlocked"]

    distinct = [
        _report(slug=slug, clinicalReasoning=90)
        for slug in ("sc_headache", "sc_cough", "sc_rash")
    ]
    assert next(
        a for a in build_achievements(distinct, []) if a["id"] == "ach_clinical_thinker"
    )["unlocked"]


def test_perfect_consultation_requires_no_safety_issue() -> None:
    flawed = [_report(96, critical=True)]
    assert not next(
        a for a in build_achievements(flawed, []) if a["id"] == "ach_perfect"
    )["unlocked"]

    clean = [_report(96)]
    assert next(a for a in build_achievements(clean, []) if a["id"] == "ach_perfect")["unlocked"]


def test_consistent_learner_needs_seven_consecutive_days() -> None:
    base = datetime(2026, 8, 10, 12, 0, tzinfo=timezone.utc)

    six = [base + timedelta(days=i) for i in range(6)]
    assert not next(
        a for a in build_achievements([_report()] * 6, six) if a["id"] == "ach_consistent"
    )["unlocked"]

    seven = [base + timedelta(days=i) for i in range(7)]
    assert next(
        a for a in build_achievements([_report()] * 7, seven) if a["id"] == "ach_consistent"
    )["unlocked"]


def test_consistent_learner_ignores_a_gap() -> None:
    base = datetime(2026, 8, 10, 12, 0, tzinfo=timezone.utc)
    gapped = [base + timedelta(days=i) for i in (0, 1, 2, 4, 5, 6, 7)]
    assert not next(
        a for a in build_achievements([_report()] * 7, gapped) if a["id"] == "ach_consistent"
    )["unlocked"]


def test_progress_never_exceeds_target() -> None:
    reports = [_report(99, slug=f"sc_{i}", clinicalReasoning=99) for i in range(20)]
    for achievement in build_achievements(reports, []):
        if achievement.get("progress"):
            assert achievement["progress"]["current"] <= achievement["progress"]["target"]


# --- Activity and streak ---------------------------------------------------


def test_weekly_activity_counts_only_the_last_seven_days() -> None:
    today = date(2026, 8, 24)  # a Monday
    finished = [
        datetime(2026, 8, 24, 9, tzinfo=timezone.utc),   # today
        datetime(2026, 8, 23, 9, tzinfo=timezone.utc),   # yesterday
        datetime(2026, 8, 1, 9, tzinfo=timezone.utc),    # outside the window
    ]
    activity = weekly_activity(finished, today)
    assert len(activity) == 7
    assert sum(a["consultations"] for a in activity) == 2


def test_streak_counts_back_from_today() -> None:
    today = date(2026, 8, 24)
    finished = [
        datetime(2026, 8, 24, 9, tzinfo=timezone.utc),
        datetime(2026, 8, 23, 9, tzinfo=timezone.utc),
        datetime(2026, 8, 22, 9, tzinfo=timezone.utc),
    ]
    assert practice_streak(finished, today) == 3


def test_streak_survives_practising_yesterday_but_not_today() -> None:
    today = date(2026, 8, 24)
    finished = [datetime(2026, 8, 23, 9, tzinfo=timezone.utc)]
    assert practice_streak(finished, today) == 1


def test_streak_is_zero_after_a_missed_day() -> None:
    today = date(2026, 8, 24)
    finished = [datetime(2026, 8, 20, 9, tzinfo=timezone.utc)]
    assert practice_streak(finished, today) == 0


# --- API -------------------------------------------------------------------

pytestmark_api = requires_postgres


def _register(client: TestClient, email: str) -> dict:
    response = client.post(
        f"{PREFIX}/auth/register",
        json={
            "firstName": "Progress", "lastName": "Student", "email": email,
            "password": "correct-horse-battery", "university": "Debrecen", "year": "3rd Year",
        },
    )
    assert response.status_code == 201
    return response.json()


@pytest.fixture()
def student(client: TestClient, seeded_catalogue: None) -> dict:
    body = _register(client, "progress@university.edu")
    return {"headers": {"Authorization": f"Bearer {body['accessToken']}"}}


@requires_postgres
def test_progress_requires_authentication(client: TestClient) -> None:
    assert client.get(f"{PREFIX}/progress").status_code == 401


@requires_postgres
def test_new_account_has_empty_progress(client: TestClient, student: dict) -> None:
    body = client.get(f"{PREFIX}/progress", headers=student["headers"]).json()

    assert body["overallScore"] == 0
    assert body["consultationsCompleted"] == 0
    assert body["streakDays"] == 0
    assert len(body["competencies"]) == 6
    assert all(c["score"] == 0 for c in body["competencies"])
    assert all(not a["unlocked"] for a in body["achievements"])
    assert sum(a["consultations"] for a in body["weeklyActivity"]) == 0


@requires_postgres
def test_progress_updates_after_a_real_consultation(client: TestClient, student: dict) -> None:
    """End to end: finishing a case must move the numbers."""
    headers = student["headers"]
    attempt = client.post(
        f"{PREFIX}/attempts", headers=headers, json={"scenarioId": "sc_headache"}
    ).json()

    for question in [
        "Do you have any allergies?",
        "Are you taking any medications?",
        "Do you have any medical conditions?",
    ]:
        client.post(
            f"{PREFIX}/attempts/{attempt['id']}/messages",
            headers=headers, json={"question": question},
        )
    client.post(
        f"{PREFIX}/attempts/{attempt['id']}/recommendation",
        headers=headers,
        json={"choice": "Paracetamol", "reasoning": "Safe with warfarin, avoids NSAID risk."},
    )
    client.post(
        f"{PREFIX}/attempts/{attempt['id']}/finish",
        headers=headers, json={"durationSeconds": 300},
    )
    client.post(f"{PREFIX}/attempts/{attempt['id']}/evaluate", headers=headers)

    body = client.get(f"{PREFIX}/progress", headers=headers).json()
    assert body["consultationsCompleted"] == 1
    assert body["overallScore"] > 0
    assert any(c["attempts"] == 1 for c in body["competencies"])
    assert next(a for a in body["achievements"] if a["id"] == "ach_first_patient")["unlocked"]
    assert sum(a["consultations"] for a in body["weeklyActivity"]) == 1


@requires_postgres
def test_progress_is_per_user(client: TestClient, student: dict) -> None:
    attempt = client.post(
        f"{PREFIX}/attempts", headers=student["headers"], json={"scenarioId": "sc_headache"}
    ).json()
    client.post(
        f"{PREFIX}/attempts/{attempt['id']}/finish",
        headers=student["headers"], json={"durationSeconds": 100},
    )
    client.post(f"{PREFIX}/attempts/{attempt['id']}/evaluate", headers=student["headers"])

    other = _register(client, "otherprogress@university.edu")
    body = client.get(
        f"{PREFIX}/progress", headers={"Authorization": f"Bearer {other['accessToken']}"}
    ).json()
    assert body["consultationsCompleted"] == 0
    assert body["overallScore"] == 0


@requires_postgres
def test_competencies_and_achievements_endpoints(client: TestClient, student: dict) -> None:
    competencies = client.get(
        f"{PREFIX}/progress/competencies", headers=student["headers"]
    ).json()
    assert len(competencies) == 6
    assert all("focusAreas" in c for c in competencies)

    achievements = client.get(
        f"{PREFIX}/progress/achievements", headers=student["headers"]
    ).json()
    assert len(achievements) == 6
