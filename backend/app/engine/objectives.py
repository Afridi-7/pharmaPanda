"""Consultation objectives, ported from `src/lib/objectives.ts`."""

CONSULTATION_OBJECTIVES = [
    {"id": "history", "label": "Gather relevant history",
     "hint": "Onset, duration, severity, what has been tried."},
    {"id": "red-flags", "label": "Screen for red flags",
     "hint": "Actively rule out the things that would stop self-care."},
    {"id": "safety", "label": "Assess medication safety",
     "hint": "Allergies, current medicines, relevant conditions."},
    {"id": "action", "label": "Determine appropriate action",
     "hint": "Commit to a recommendation and justify it."},
    {"id": "counsel", "label": "Counsel the patient",
     "hint": "Explain the plan in language the patient can use."},
    {"id": "referral", "label": "Decide whether referral is needed",
     "hint": "Say what should happen next, and how urgently."},
]


def evaluate_objectives(attempt: dict, facts: list[dict]) -> list[str]:
    """Completion is derived from behaviour, never self-reported."""
    revealed_ids = attempt["revealedFactIds"]
    revealed = [f for f in facts if f["id"] in revealed_ids and not f["revealedAtStart"]]
    met: list[str] = []

    historyish = [f for f in revealed if f["section"] in ("symptoms", "other", "history")]
    if len(historyish) >= 2:
        met.append("history")

    if any(f["credits"] == "clinicalReasoning" for f in revealed):
        met.append("red-flags")

    safety = [f for f in revealed
              if f["section"] in ("allergies", "medications") or f["credits"] == "medicationSafety"]
    if len(safety) >= 2:
        met.append("safety")

    if attempt.get("recommendation"):
        met.append("action")
    if (attempt.get("counseling") or "").strip() and len((attempt.get("counseling") or "").strip()) > 30:
        met.append("counsel")
    if attempt.get("referral"):
        met.append("referral")

    return met
