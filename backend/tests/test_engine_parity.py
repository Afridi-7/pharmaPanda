"""
Engine parity regression.

`tests/data/engine_reference.json` holds real consultations captured from the
original TypeScript engine, with the exact report each produced. These tests
assert the Python port still returns byte-identical output.

This guards the highest-risk part of the migration: a scoring drift would be
invisible in the UI but would silently change every student's grade.
"""

import json
from pathlib import Path

import pytest

from app.engine.evaluation import compute_evaluation
from app.engine.text import matches_any, normalise

REFERENCE = json.loads(
    (Path(__file__).parent / "data" / "engine_reference.json").read_text(encoding="utf-8")
)
CASES = sorted(REFERENCE["cases"])


@pytest.fixture(scope="module")
def scenario() -> dict:
    return REFERENCE["scenario"]


@pytest.fixture(scope="module")
def patient() -> dict:
    return REFERENCE["patient"]


def _evaluate(case_name: str, scenario: dict, patient: dict) -> tuple[dict, dict]:
    case = REFERENCE["cases"][case_name]
    return case["output"], compute_evaluation(case["input"]["attempt"], scenario, patient)


@pytest.mark.parametrize("case_name", CASES)
def test_total_score_matches(case_name: str, scenario: dict, patient: dict) -> None:
    expected, actual = _evaluate(case_name, scenario, patient)
    assert actual["totalScore"] == expected["totalScore"]


@pytest.mark.parametrize("case_name", CASES)
def test_headline_matches(case_name: str, scenario: dict, patient: dict) -> None:
    expected, actual = _evaluate(case_name, scenario, patient)
    assert actual["headline"] == expected["headline"]


@pytest.mark.parametrize("case_name", CASES)
def test_competency_scores_match(case_name: str, scenario: dict, patient: dict) -> None:
    expected, actual = _evaluate(case_name, scenario, patient)
    assert actual["scores"] == expected["scores"]


@pytest.mark.parametrize("case_name", CASES)
def test_strengths_match(case_name: str, scenario: dict, patient: dict) -> None:
    """Wording is asserted too — feedback copy is part of the product."""
    expected, actual = _evaluate(case_name, scenario, patient)
    assert [(s["title"], s["detail"]) for s in actual["strengths"]] == [
        tuple(s) for s in expected["strengths"]
    ]


@pytest.mark.parametrize("case_name", CASES)
def test_missed_items_match(case_name: str, scenario: dict, patient: dict) -> None:
    expected, actual = _evaluate(case_name, scenario, patient)
    assert [(s["title"], s["detail"]) for s in actual["missed"]] == [
        tuple(s) for s in expected["missed"]
    ]


@pytest.mark.parametrize("case_name", CASES)
def test_safety_issues_match(case_name: str, scenario: dict, patient: dict) -> None:
    expected, actual = _evaluate(case_name, scenario, patient)
    assert [
        (s["severity"], s["title"], s["what"], s["why"]) for s in actual["safetyIssues"]
    ] == [tuple(s) for s in expected["safetyIssues"]]


@pytest.mark.parametrize("case_name", CASES)
def test_timeline_matches(case_name: str, scenario: dict, patient: dict) -> None:
    expected, actual = _evaluate(case_name, scenario, patient)
    assert [(s["kind"], s["label"], s["detail"]) for s in actual["timeline"]] == [
        tuple(s) for s in expected["timeline"]
    ]


@pytest.mark.parametrize("case_name", CASES)
def test_better_approach_and_next_case_match(case_name: str, scenario: dict, patient: dict) -> None:
    expected, actual = _evaluate(case_name, scenario, patient)
    assert actual["betterApproach"] == expected["betterApproach"]
    assert actual["nextScenarioId"] == expected["nextScenarioId"]


def test_unsafe_case_is_capped_and_flagged(scenario: dict, patient: dict) -> None:
    """The NSAID-on-warfarin path must stay a critical issue with a capped score."""
    _, actual = _evaluate("unsafe", scenario, patient)
    assert any(i["severity"] == "critical" for i in actual["safetyIssues"])
    assert actual["totalScore"] <= 68


# --- Text-matching primitives ---------------------------------------------
# These decide which question unlocks which fact, so they are pinned directly.


@pytest.mark.parametrize(
    ("question", "triggers", "expected"),
    [
        ("Do you have any allergies?", ["allerg"], True),
        ("Are you taking any medications?", ["medication"], True),
        ("Do you have any medical conditions?", ["medical condition"], True),
        ("Do you have any allergies?", ["medication"], False),
        ("ALLERGIES?!", ["allerg"], True),
    ],
)
def test_trigger_matching(question: str, triggers: list[str], expected: bool) -> None:
    assert matches_any(question, triggers) is expected


def test_normalise_strips_punctuation_and_collapses_space() -> None:
    assert normalise("Hi!  I've  had a REALLY bad headache...") == "hi i ve had a really bad headache"
