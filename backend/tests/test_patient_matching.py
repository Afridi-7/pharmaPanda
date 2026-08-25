"""
Question matching.

Regression cover for two real defects:

* Short keywords matched inside longer words, so "Is **thi**s..." was read as
  the greeting "hi" and the patient replied "thank you for asking".
* Only the exact authored phrasing unlocked a fact, so a student who asked the
  same thing in their own words got nothing.
"""

import json
from pathlib import Path

import pytest

from app.engine.patient import PatientEngineState, respond
from app.engine.text import matches_any

CATALOGUE = json.loads(
    (Path(__file__).parent.parent / "scripts" / "data" / "catalogue.json").read_text(encoding="utf-8")
)
SARAH = next(p for p in CATALOGUE["patients"] if p["id"] == "pat_sarah")

GREETINGS = [
    "hello", "hi", "good morning", "good afternoon", "my name is",
    "i am the pharmacist", "how can i help", "how are you", "sorry to hear",
    "that sounds", "take a seat", "privacy", "private",
]


@pytest.mark.parametrize(
    "question",
    [
        "Is this something you have had before?",
        "Which painkillers have you tried?",
        "Anything else in your history?",
        "What is this like when it is worst?",
        "Something you take often?",
    ],
)
def test_clinical_questions_are_not_mistaken_for_greetings(question: str) -> None:
    """"hi" inside "this"/"which"/"anything" must not fire."""
    assert matches_any(question, GREETINGS) is False


@pytest.mark.parametrize(
    "question",
    ["Hello, how can I help?", "Hi there", "Good morning", "How are you today?"],
)
def test_real_greetings_still_match(question: str) -> None:
    assert matches_any(question, GREETINGS) is True


def test_stems_still_match_their_variants() -> None:
    """Authored stems like "allerg" must keep catching every inflection."""
    assert matches_any("Do you have any allergies?", ["allerg"])
    assert matches_any("Are you allergic to anything?", ["allerg"])
    assert matches_any("Are you taking any medications?", ["medication"])


def _ask(question: str) -> list[str]:
    state = PatientEngineState(
        revealed_fact_ids=["sarah_age", "sarah_complaint"], question_count=1
    )
    return [f["id"] for f in respond(SARAH, question, state).revealed]


@pytest.mark.parametrize(
    ("question", "expected"),
    [
        ("Do you have any allergies?", "sarah_allergy"),
        ("Are you allergic to anything?", "sarah_allergy"),
        ("Is there anything you cannot take?", "sarah_allergy"),
        ("Are you taking any medications?", "sarah_meds"),
        ("What do you take regularly?", "sarah_meds"),
        ("Are you on any tablets from the doctor?", "sarah_meds"),
        ("Do you have any medical conditions?", "sarah_history"),
        ("Any conditions you see a doctor about?", "sarah_history"),
        ("Have you had any other illness?", "sarah_history"),
    ],
)
def test_students_can_phrase_a_question_their_own_way(question: str, expected: str) -> None:
    assert expected in _ask(question)


def test_an_unrecognised_question_offers_a_hint_after_a_dry_run() -> None:
    """
    A student whose phrasing does not land needs a signal, not silence.

    The hint names an unexplored *area*; naming the finding would give away the
    answer the consultation exists to uncover.
    """
    state = PatientEngineState(
        revealed_fact_ids=["sarah_age", "sarah_complaint"],
        question_count=3,
        unproductive_streak=2,
    )
    turn = respond(SARAH, "Could you elaborate on the general situation?", state)

    hints = [m for m in turn.messages if m["author"] == "system"]
    assert hints, "expected a coaching hint after two unproductive questions"

    text = hints[0]["text"]
    assert "did not follow" in text
    # The hint must not disclose the hidden facts themselves.
    for secret in ("warfarin", "aspirin", "ulcer"):
        assert secret not in text.lower()


def test_no_hint_while_questions_are_still_landing() -> None:
    state = PatientEngineState(
        revealed_fact_ids=["sarah_age", "sarah_complaint"],
        question_count=1,
        unproductive_streak=0,
    )
    turn = respond(SARAH, "Do you have any allergies?", state)
    assert not [m for m in turn.messages if "did not follow" in m["text"]]
