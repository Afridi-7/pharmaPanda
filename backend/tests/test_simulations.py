"""
Simulation API tests.

Cover the consultation lifecycle, the discovery mechanic, per-user isolation and
the evaluation flow, against the dedicated test database.
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.config import settings
from tests.conftest import requires_postgres

pytestmark = requires_postgres

PREFIX = settings.API_PREFIX
PASSWORD = "correct-horse-battery"


def _register(client: TestClient, email: str) -> dict:
    response = client.post(
        f"{PREFIX}/auth/register",
        json={
            "firstName": "Test", "lastName": "Student", "email": email,
            "password": PASSWORD, "university": "University of Debrecen", "year": "3rd Year",
        },
    )
    assert response.status_code == 201, response.text
    return response.json()


def _auth(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture()
def student(client: TestClient, seeded_catalogue: None) -> dict:
    body = _register(client, "student@university.edu")
    return {"headers": _auth(body["accessToken"]), "user": body["user"]}


@pytest.fixture()
def attempt(client: TestClient, student: dict) -> dict:
    response = client.post(
        f"{PREFIX}/attempts", headers=student["headers"], json={"scenarioId": "sc_headache"}
    )
    assert response.status_code == 201, response.text
    return response.json()


# --- Catalogue ------------------------------------------------------------


def test_scenarios_require_authentication(client: TestClient, seeded_catalogue: None) -> None:
    assert client.get(f"{PREFIX}/scenarios").status_code == 401


def test_lists_scenarios(client: TestClient, student: dict) -> None:
    response = client.get(f"{PREFIX}/scenarios", headers=student["headers"])
    assert response.status_code == 200
    scenarios = response.json()
    assert len(scenarios) == 10
    assert all(s["status"] == "not-started" for s in scenarios)


def test_gets_one_scenario(client: TestClient, student: dict) -> None:
    response = client.get(f"{PREFIX}/scenarios/sc_headache", headers=student["headers"])
    assert response.status_code == 200
    body = response.json()
    assert "Headache" in body["title"]
    assert body["durationMinutes"] == [8, 10]


def test_unknown_scenario_is_404(client: TestClient, student: dict) -> None:
    assert client.get(f"{PREFIX}/scenarios/nope", headers=student["headers"]).status_code == 404


# --- Attempt lifecycle ----------------------------------------------------


def test_start_creates_attempt_with_opening_message(attempt: dict) -> None:
    assert attempt["status"] == "in-progress"
    assert attempt["scenarioId"] == "sc_headache"
    assert any(m["author"] == "patient" for m in attempt["messages"])
    # Only the two revealed-at-start facts.
    assert len(attempt["revealedFactIds"]) == 2


def test_start_rejects_unknown_scenario(client: TestClient, student: dict) -> None:
    response = client.post(
        f"{PREFIX}/attempts", headers=student["headers"], json={"scenarioId": "nope"}
    )
    assert response.status_code == 404


def test_ask_reveals_allergy(client: TestClient, student: dict, attempt: dict) -> None:
    response = client.post(
        f"{PREFIX}/attempts/{attempt['id']}/messages",
        headers=student["headers"],
        json={"question": "Do you have any allergies?"},
    )
    assert response.status_code == 200
    body = response.json()
    assert any("Aspirin" in f["value"] for f in body["revealed"])
    assert "sarah_allergy" in body["attempt"]["revealedFactIds"]


def test_ask_reveals_medication_and_history(client: TestClient, student: dict, attempt: dict) -> None:
    for question, expected in [
        ("Are you taking any medications?", "Warfarin"),
        ("Do you have any medical conditions?", "ulcer"),
    ]:
        response = client.post(
            f"{PREFIX}/attempts/{attempt['id']}/messages",
            headers=student["headers"],
            json={"question": question},
        )
        assert response.status_code == 200
        assert any(expected.lower() in f["value"].lower() for f in response.json()["revealed"])


def test_patient_endpoint_hides_undiscovered_facts(
    client: TestClient, student: dict, attempt: dict
) -> None:
    """The core mechanic: hidden clinical detail must never leave the server."""
    response = client.get(f"{PREFIX}/attempts/{attempt['id']}/patient", headers=student["headers"])
    assert response.status_code == 200
    body = response.json()

    assert body["name"] == "Iqra Muhammad"
    assert len(body["facts"]) == 2  # age + chief complaint only

    raw = response.text
    for hidden in ("Warfarin", "Aspirin", "ulcer", "pregnant"):
        assert hidden not in raw


def test_patient_endpoint_grows_as_facts_are_revealed(
    client: TestClient, student: dict, attempt: dict
) -> None:
    client.post(
        f"{PREFIX}/attempts/{attempt['id']}/messages",
        headers=student["headers"],
        json={"question": "Do you have any allergies?"},
    )
    response = client.get(f"{PREFIX}/attempts/{attempt['id']}/patient", headers=student["headers"])
    assert "Aspirin" in response.text
    assert "Warfarin" not in response.text  # still not asked


def test_notes_persist(client: TestClient, student: dict, attempt: dict) -> None:
    client.patch(
        f"{PREFIX}/attempts/{attempt['id']}/notes",
        headers=student["headers"],
        json={"notes": "Warfarin — avoid NSAIDs."},
    )
    response = client.get(f"{PREFIX}/attempts/{attempt['id']}", headers=student["headers"])
    assert "avoid NSAIDs" in response.json()["notes"]


def test_recommendation_counsel_referral_persist(
    client: TestClient, student: dict, attempt: dict
) -> None:
    client.post(
        f"{PREFIX}/attempts/{attempt['id']}/recommendation",
        headers=student["headers"],
        json={"choice": "Paracetamol", "reasoning": "Safe with warfarin."},
    )
    client.post(
        f"{PREFIX}/attempts/{attempt['id']}/counseling",
        headers=student["headers"],
        json={"script": "Up to 1g four times daily, max 4g in 24 hours."},
    )
    client.post(
        f"{PREFIX}/attempts/{attempt['id']}/referral",
        headers=student["headers"],
        json={"choice": "Routine physician referral", "reasoning": "INR review."},
    )

    body = client.get(f"{PREFIX}/attempts/{attempt['id']}", headers=student["headers"]).json()
    assert body["recommendation"]["choice"] == "Paracetamol"
    assert "4g in 24 hours" in body["counseling"]
    assert body["referral"]["choice"] == "Routine physician referral"


def test_objectives_update_from_behaviour(client: TestClient, student: dict, attempt: dict) -> None:
    before = attempt["objectivesMet"]
    assert before == []

    client.post(
        f"{PREFIX}/attempts/{attempt['id']}/recommendation",
        headers=student["headers"],
        json={"choice": "Paracetamol", "reasoning": "Safe."},
    )
    body = client.get(f"{PREFIX}/attempts/{attempt['id']}", headers=student["headers"]).json()
    assert "action" in body["objectivesMet"]


def test_invalid_recommendation_choice_is_422(
    client: TestClient, student: dict, attempt: dict
) -> None:
    response = client.post(
        f"{PREFIX}/attempts/{attempt['id']}/recommendation",
        headers=student["headers"],
        json={"choice": "Antibiotics", "reasoning": "No."},
    )
    assert response.status_code == 422


# --- Isolation ------------------------------------------------------------


def test_another_user_cannot_read_the_attempt(
    client: TestClient, student: dict, attempt: dict
) -> None:
    other = _register(client, "intruder@university.edu")
    headers = _auth(other["accessToken"])

    assert client.get(f"{PREFIX}/attempts/{attempt['id']}", headers=headers).status_code == 404
    assert client.get(f"{PREFIX}/attempts/{attempt['id']}/patient", headers=headers).status_code == 404


def test_another_user_cannot_mutate_the_attempt(
    client: TestClient, student: dict, attempt: dict
) -> None:
    other = _register(client, "intruder2@university.edu")
    headers = _auth(other["accessToken"])

    response = client.post(
        f"{PREFIX}/attempts/{attempt['id']}/messages",
        headers=headers,
        json={"question": "Do you have any allergies?"},
    )
    assert response.status_code == 404


def test_attempt_requires_authentication(client: TestClient, attempt: dict) -> None:
    assert client.get(f"{PREFIX}/attempts/{attempt['id']}").status_code == 401


def test_malformed_attempt_id_is_404(client: TestClient, student: dict) -> None:
    assert client.get(f"{PREFIX}/attempts/not-a-uuid", headers=student["headers"]).status_code == 404


# --- Finish and evaluate --------------------------------------------------


def _run_full_consultation(client: TestClient, student: dict, attempt_id: str) -> None:
    for question in [
        "Do you have any allergies?",
        "Are you taking any medications?",
        "Do you have any medical conditions?",
        "How long have you had it and how bad is it?",
    ]:
        client.post(
            f"{PREFIX}/attempts/{attempt_id}/messages",
            headers=student["headers"],
            json={"question": question},
        )
    client.post(
        f"{PREFIX}/attempts/{attempt_id}/recommendation",
        headers=student["headers"],
        json={
            "choice": "Paracetamol",
            "reasoning": "Paracetamol is safe with warfarin and avoids NSAID bleeding and ulcer risk.",
        },
    )
    client.post(
        f"{PREFIX}/attempts/{attempt_id}/counseling",
        headers=student["headers"],
        json={"script": "Up to 1g four times daily, no more than 4g in 24 hours. Come back if it persists."},
    )
    client.post(
        f"{PREFIX}/attempts/{attempt_id}/referral",
        headers=student["headers"],
        json={"choice": "Routine physician referral", "reasoning": "INR review given warfarin."},
    )


def test_finish_locks_the_attempt(client: TestClient, student: dict, attempt: dict) -> None:
    response = client.post(
        f"{PREFIX}/attempts/{attempt['id']}/finish",
        headers=student["headers"],
        json={"durationSeconds": 300},
    )
    assert response.status_code == 200
    assert response.json()["status"] == "submitted"

    blocked = client.post(
        f"{PREFIX}/attempts/{attempt['id']}/messages",
        headers=student["headers"],
        json={"question": "One more question?"},
    )
    assert blocked.status_code == 409


def test_evaluate_produces_a_report(client: TestClient, student: dict, attempt: dict) -> None:
    _run_full_consultation(client, student, attempt["id"])
    client.post(
        f"{PREFIX}/attempts/{attempt['id']}/finish",
        headers=student["headers"],
        json={"durationSeconds": 372},
    )

    response = client.post(f"{PREFIX}/attempts/{attempt['id']}/evaluate", headers=student["headers"])
    assert response.status_code == 200
    report = response.json()

    assert len(report["scores"]) == 6
    assert report["totalScore"] > 0
    assert report["timeline"]
    assert report["betterApproach"]
    assert report["nextScenarioId"]


def test_evaluate_is_idempotent(client: TestClient, student: dict, attempt: dict) -> None:
    """A retried request must not produce a second, different grade."""
    _run_full_consultation(client, student, attempt["id"])
    client.post(
        f"{PREFIX}/attempts/{attempt['id']}/finish",
        headers=student["headers"], json={"durationSeconds": 300},
    )

    first = client.post(f"{PREFIX}/attempts/{attempt['id']}/evaluate", headers=student["headers"]).json()
    second = client.post(f"{PREFIX}/attempts/{attempt['id']}/evaluate", headers=student["headers"]).json()
    assert first["id"] == second["id"]
    assert first["totalScore"] == second["totalScore"]


def test_unsafe_recommendation_is_flagged_critical(
    client: TestClient, student: dict, attempt: dict
) -> None:
    for question in ["Do you have any allergies?", "Are you taking any medications?"]:
        client.post(
            f"{PREFIX}/attempts/{attempt['id']}/messages",
            headers=student["headers"], json={"question": question},
        )
    client.post(
        f"{PREFIX}/attempts/{attempt['id']}/recommendation",
        headers=student["headers"],
        json={"choice": "NSAID", "reasoning": "Ibuprofen should help."},
    )
    client.post(
        f"{PREFIX}/attempts/{attempt['id']}/finish",
        headers=student["headers"], json={"durationSeconds": 200},
    )

    report = client.post(
        f"{PREFIX}/attempts/{attempt['id']}/evaluate", headers=student["headers"]
    ).json()
    assert any(i["severity"] == "critical" for i in report["safetyIssues"])
    assert report["totalScore"] <= 68


def test_evaluation_retrievable_for_results_page(
    client: TestClient, student: dict, attempt: dict
) -> None:
    _run_full_consultation(client, student, attempt["id"])
    client.post(
        f"{PREFIX}/attempts/{attempt['id']}/finish",
        headers=student["headers"], json={"durationSeconds": 300},
    )
    client.post(f"{PREFIX}/attempts/{attempt['id']}/evaluate", headers=student["headers"])

    response = client.get(
        f"{PREFIX}/attempts/{attempt['id']}/evaluation", headers=student["headers"]
    )
    assert response.status_code == 200
    assert response.json()["attemptId"] == attempt["id"]


def test_another_user_cannot_read_the_report(client: TestClient, student: dict, attempt: dict) -> None:
    _run_full_consultation(client, student, attempt["id"])
    client.post(
        f"{PREFIX}/attempts/{attempt['id']}/finish",
        headers=student["headers"], json={"durationSeconds": 300},
    )
    client.post(f"{PREFIX}/attempts/{attempt['id']}/evaluate", headers=student["headers"])

    other = _register(client, "intruder3@university.edu")
    response = client.get(
        f"{PREFIX}/attempts/{attempt['id']}/evaluation", headers=_auth(other["accessToken"])
    )
    assert response.status_code == 404


def test_scenario_shows_completed_after_evaluation(
    client: TestClient, student: dict, attempt: dict
) -> None:
    _run_full_consultation(client, student, attempt["id"])
    client.post(
        f"{PREFIX}/attempts/{attempt['id']}/finish",
        headers=student["headers"], json={"durationSeconds": 300},
    )
    client.post(f"{PREFIX}/attempts/{attempt['id']}/evaluate", headers=student["headers"])

    body = client.get(f"{PREFIX}/scenarios/sc_headache", headers=student["headers"]).json()
    assert body["status"] == "completed"
    assert body["previousScore"] is not None
    assert body["lastAttemptId"] == attempt["id"]


def test_history_lists_the_finished_consultation(
    client: TestClient, student: dict, attempt: dict
) -> None:
    _run_full_consultation(client, student, attempt["id"])
    client.post(
        f"{PREFIX}/attempts/{attempt['id']}/finish",
        headers=student["headers"], json={"durationSeconds": 300},
    )
    client.post(f"{PREFIX}/attempts/{attempt['id']}/evaluate", headers=student["headers"])

    rows = client.get(f"{PREFIX}/attempts", headers=student["headers"]).json()
    assert len(rows) == 1
    assert rows[0]["attemptId"] == attempt["id"]


def test_history_is_per_user(client: TestClient, student: dict, attempt: dict) -> None:
    other = _register(client, "separate@university.edu")
    rows = client.get(f"{PREFIX}/attempts", headers=_auth(other["accessToken"])).json()
    assert rows == []


# --- Shared metadata ------------------------------------------------------


def test_objectives_endpoint(client: TestClient, student: dict) -> None:
    objectives = client.get(f"{PREFIX}/objectives", headers=student["headers"]).json()
    assert len(objectives) == 6
    assert {o["id"] for o in objectives} >= {"history", "safety", "action"}


def test_evaluation_stages_endpoint(client: TestClient, student: dict) -> None:
    stages = client.get(f"{PREFIX}/evaluation-stages", headers=student["headers"]).json()
    assert len(stages) == 6
