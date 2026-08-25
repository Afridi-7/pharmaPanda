"""
Deterministic patient engine.

Ported from `src/lib/patientEngine.ts`. Everything the simulated patient says is
derived from scenario data plus the student's question — there is no model
involved. `respond()` is a pure function of (patient, question, state).
"""

import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone

from app.engine.text import matches_any, normalise, pick

GREETING_KEYWORDS = [
    "hello", "hi", "good morning", "good afternoon", "my name is",
    "i am the pharmacist", "how can i help", "how are you", "sorry to hear",
    "that sounds", "take a seat", "privacy", "private",
]

OPEN_PROMPTS = [
    "tell me more", "anything else", "what else", "go on", "describe",
    "walk me through", "is there anything",
]

CLOSING_KEYWORDS = [
    "any questions", "does that make sense", "is that clear",
    "to summarise", "to summarize",
]


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _message(author: str, text: str, **extra) -> dict:
    return {"id": f"msg_{uuid.uuid4().hex[:7]}", "author": author, "text": text, "at": _now(), **extra}


@dataclass
class PatientEngineState:
    revealed_fact_ids: list[str] = field(default_factory=list)
    question_count: int = 0
    unproductive_streak: int = 0
    rapport_shown: bool = False


@dataclass
class PatientTurn:
    messages: list[dict]
    revealed: list[dict]
    confused: bool
    mood: str


def initial_messages(patient: dict) -> list[dict]:
    return [
        _message("system", f"{patient['name']} approaches the counter.", tone="neutral"),
        _message(
            "patient",
            patient["openingLine"],
            tone="concerned" if patient["mood"] == "worried" else "neutral",
        ),
    ]


def starting_facts(patient: dict) -> list[dict]:
    return [f for f in patient["facts"] if f["revealedAtStart"]]


def _match_facts(patient: dict, question: str, revealed_ids: list[str]) -> list[dict]:
    return [
        f for f in patient["facts"]
        if not f["revealedAtStart"]
        and f["id"] not in revealed_ids
        and matches_any(question, f["triggers"])
    ]


def _next_unrevealed(patient: dict, revealed_ids: list[str], sections: list[str]) -> dict | None:
    for f in patient["facts"]:
        if not f["revealedAtStart"] and f["id"] not in revealed_ids and f["section"] in sections:
            return f
    return None


# Sections mapped to the plain-language area a student would recognise.
_SECTION_HINTS = {
    "allergies": "allergies",
    "medications": "current medication",
    "history": "past medical history",
    "symptoms": "the symptoms themselves",
    "other": "what else is going on",
}


def _coaching_hint(patient: dict, revealed_ids: list[str]) -> str | None:
    """
    Nudge toward an unexplored area without disclosing what is in it.

    Deliberately names a topic, not a fact: "you have not asked about current
    medication yet" is a prompt to ask; naming the warfarin would be the answer.
    """
    outstanding: list[str] = []
    for section in ("allergies", "medications", "history", "symptoms", "other"):
        has_hidden = any(
            f["section"] == section
            and not f["revealedAtStart"]
            and f["id"] not in revealed_ids
            for f in patient["facts"]
        )
        if has_hidden:
            outstanding.append(_SECTION_HINTS[section])

    if not outstanding:
        return None

    areas = outstanding[:2]
    joined = areas[0] if len(areas) == 1 else f"{areas[0]} and {areas[1]}"
    return (
        f"The patient did not follow that. Try asking a direct question about {joined} "
        f"— for example, \"Do you take any medicines regularly?\""
    )


def respond(patient: dict, question: str, state: PatientEngineState) -> PatientTurn:
    text = normalise(question)
    seed = state.question_count + len(text)
    messages: list[dict] = []
    mood = patient["mood"]
    confused = False

    used_jargon = [j for j in patient["jargon"] if matches_any(text, [j])]
    is_greeting = matches_any(text, GREETING_KEYWORDS)
    is_open_prompt = matches_any(text, OPEN_PROMPTS)
    is_closing = matches_any(text, CLOSING_KEYWORDS)

    revealed = _match_facts(patient, question, state.revealed_fact_ids)[:2]

    # An open invitation nudges the patient to volunteer the next symptom detail.
    if not revealed and is_open_prompt:
        volunteered = _next_unrevealed(patient, state.revealed_fact_ids, ["symptoms", "other"])
        if volunteered:
            revealed = [volunteered]

    if is_greeting and not state.rapport_shown:
        mood = "calm" if patient["mood"] == "impatient" else patient["mood"]
        messages.append(_message("patient", pick([
            "Thank you — that is kind of you to ask.",
            "I appreciate you taking the time.",
            "Yes, thank you. It has been a bit of a day.",
        ], seed), tone="reassured"))

    # Jargon the patient cannot parse: they say so, and only partially engage.
    if used_jargon:
        confused = True
        messages.append(_message(
            "patient", f"Sorry — “{used_jargon[0]}”? I do not know what that means.", tone="confused"
        ))
        messages.append(_message(
            "system", f"{patient['name']} did not understand the terminology you used.", tone="confused"
        ))

    for fact in revealed:
        messages.append(_message(
            "patient", fact["patientLine"],
            revealed=[fact["id"]],
            tone="concerned" if fact.get("safetyCritical") else "neutral",
        ))

    # Patient-initiated follow-ups, driven by what the student mentioned.
    follow_up = next((f for f in patient["followUps"] if matches_any(text, f["triggers"])), None)
    if follow_up:
        messages.append(_message("patient", follow_up["line"], tone="concerned"))

    if not messages:
        if is_closing:
            messages.append(_message(
                "patient", "I think so. Let me make sure I have it right before I go.", tone="reassured"
            ))
        elif state.unproductive_streak >= 2 and patient["impatientLines"]:
            mood = "impatient"
            messages.append(_message("patient", pick(patient["impatientLines"], seed), tone="impatient"))
        else:
            messages.append(_message("patient", pick(patient["deflections"], seed), tone="neutral"))

        # After a run of questions that uncovered nothing, say so plainly. A
        # student whose phrasing the patient does not follow otherwise has no
        # signal to change approach. The hint names the *area* still unexplored,
        # never the finding itself.
        if state.unproductive_streak >= 2:
            hint = _coaching_hint(patient, state.revealed_fact_ids)
            if hint:
                messages.append(_message("system", hint, tone="neutral"))

    if any(f.get("safetyCritical") for f in revealed):
        messages.append(_message(
            "system", "A safety-relevant detail has been added to Patient Information.", tone="concerned"
        ))

    return PatientTurn(messages=messages, revealed=revealed, confused=confused, mood=mood)
