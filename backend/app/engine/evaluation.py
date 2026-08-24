"""
Deterministic evaluation engine.

Ported from `src/lib/evaluationEngine.ts`. Scores *behaviour* — what the student
asked, in what order, and what they did with the answers — rather than only the
final recommendation. Every constant and threshold is reproduced exactly; this
is a behaviour-preserving port, not a rewrite.
"""

import uuid
from datetime import datetime, timezone

from app.engine.rules import EVALUATION_STAGES, rule_for
from app.engine.text import clamp, matches_any

COMPETENCY_LABELS = {
    "historyTaking": "History Taking",
    "clinicalReasoning": "Clinical Reasoning",
    "medicationSafety": "Medication Safety",
    "counseling": "Counseling",
    "communication": "Communication",
    "referralDecisions": "Referral Decisions",
}

WEIGHTS = {
    "historyTaking": 0.20,
    "clinicalReasoning": 0.22,
    "medicationSafety": 0.24,
    "counseling": 0.16,
    "communication": 0.09,
    "referralDecisions": 0.09,
}

COUNSELING_MARKERS = [
    {"keys": ["dose", "mg", "ml", "tablet", "puff"], "label": "stated the dose"},
    {
        "keys": ["maximum", "max", "no more than", "per day", "in 24 hours", "four times"],
        "label": "gave a daily limit",
    },
    {
        "keys": ["come back", "see a doctor", "if it gets worse", "worse", "return", "call", "seek"],
        "label": "safety-netted",
    },
    {
        "keys": ["with food", "water", "how to take", "morning", "night", "rinse", "spacer"],
        "label": "explained how to use it",
    },
    {
        "keys": ["any questions", "does that make sense", "repeat", "tell me how you", "teach"],
        "label": "checked understanding",
    },
]

EMPATHY_MARKERS = [
    "sorry to hear",
    "that sounds",
    "i understand",
    "must be",
    "thank you for",
    "i can see why",
]

# Curly punctuation matches the original copy exactly.
LQUO, RQUO = "“", "”"
ELLIPSIS = "…"
APOS = "’"
DASH = "—"
ENDASH = "–"


def _uid(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex[:7]}"


def _highlight(title: str, detail: str) -> dict:
    return {"id": _uid("hl"), "title": title, "detail": detail}


def _student_questions(attempt: dict) -> list[dict]:
    return [a for a in attempt["actions"] if a["type"] == "question"]


def _build_timeline(attempt: dict, patient: dict, unsafe: list[dict]) -> list[dict]:
    steps: list[dict] = []
    fact_by_id = {f["id"]: f for f in patient["facts"]}

    for action in attempt["actions"]:
        kind = action["type"]
        if kind == "question":
            steps.append({
                "id": _uid("tl"), "kind": "student-ask", "label": "Student asked",
                "detail": f"{LQUO}{action['content'].strip()}{RQUO}",
            })
            for fact_id in action.get("revealed") or []:
                fact = fact_by_id.get(fact_id)
                if not fact:
                    continue
                steps.append({
                    "id": _uid("tl"), "kind": "patient-reveal", "label": "Patient revealed",
                    "detail": f"{fact['label']}: {fact['value']}",
                })
        elif kind == "recommendation":
            extra = f" {DASH} {LQUO}{action['content'].strip()}{RQUO}" if action.get("content") else ""
            steps.append({
                "id": _uid("tl"), "kind": "student-decision", "label": "Student recommended",
                "detail": f"{action.get('choice')}{extra}",
            })
        elif kind == "counseling":
            text = action["content"].strip()
            clipped = text[:160] + (ELLIPSIS if len(text) > 160 else "")
            steps.append({
                "id": _uid("tl"), "kind": "student-counsel", "label": "Student counselled",
                "detail": f"{LQUO}{clipped}{RQUO}",
            })
        elif kind == "referral":
            extra = f" {DASH} {LQUO}{action['content'].strip()}{RQUO}" if action.get("content") else ""
            steps.append({
                "id": _uid("tl"), "kind": "student-decision",
                "label": "Student decided on referral",
                "detail": f"{action.get('choice')}{extra}",
            })

    for issue in unsafe:
        steps.append({
            "id": _uid("tl"), "kind": "system-detect", "label": "System detected",
            "detail": issue["title"],
        })

    return steps


def _score(attempt: dict, scenario_slug: str, patient: dict) -> dict:
    rule = rule_for(scenario_slug)
    revealed_ids = attempt["revealedFactIds"]
    revealed = [f for f in patient["facts"] if f["id"] in revealed_ids and not f["revealedAtStart"]]
    questions = _student_questions(attempt)
    question_text = " ".join(q["content"] for q in questions)
    counseling = attempt.get("counseling") or ""

    scores = {
        "historyTaking": 42, "clinicalReasoning": 44, "medicationSafety": 44,
        "counseling": 40, "communication": 46, "referralDecisions": 46,
    }
    strengths: list[dict] = []
    missed: list[dict] = []
    safety_issues: list[dict] = []

    # --- Discovery: every uncovered fact credits its competency. -------------
    for fact in revealed:
        scores[fact["credits"]] += 13 if fact.get("safetyCritical") else 8
        if fact["section"] == "symptoms":
            scores["historyTaking"] += 3

    asked_allergies = any(f["section"] == "allergies" for f in revealed)
    asked_meds = any(f["section"] == "medications" for f in revealed)
    asked_history = any(f["section"] == "history" for f in revealed)
    asked_severity = matches_any(
        question_text, ["how bad", "severity", "scale", "how severe", "how painful"]
    )
    asked_duration = matches_any(question_text, ["how long", "when did", "since when", "started"])

    if asked_allergies:
        scores["medicationSafety"] += 8
        strengths.append(_highlight(
            "Checked for allergies",
            "You asked directly about drug allergies before choosing a product.",
        ))
    else:
        missed.append(_highlight(
            "You did not ask about allergies",
            "Allergy status changes which agents are available to you. Ask it early "
            f"{DASH} it takes one sentence and it can rule out an entire drug class.",
        ))
        scores["medicationSafety"] -= 10

    if asked_meds:
        scores["medicationSafety"] += 8
        strengths.append(_highlight(
            "Asked about current medication",
            "You established the current medication list before recommending anything.",
        ))
    else:
        missed.append(_highlight(
            "Current medication was never established",
            "Without the medication list you cannot screen for interactions. In this case there was "
            "something in it that mattered.",
        ))
        scores["medicationSafety"] -= 12

    if asked_history:
        scores["historyTaking"] += 7
    else:
        missed.append(_highlight(
            "You could have explored medical history earlier",
            "Past conditions frequently decide whether an over-the-counter option is safe. Asking "
            f"{LQUO}any conditions you see a doctor about?{RQUO} usually surfaces it.",
        ))

    if asked_duration:
        scores["historyTaking"] += 6
    if asked_severity:
        scores["historyTaking"] += 6
    else:
        missed.append(_highlight(
            "You did not assess symptom severity early",
            f"Severity shapes both urgency and product choice. A quick 0{ENDASH}10 scale in your "
            "first two questions gives you a baseline to counsel against.",
        ))

    # Breadth of questioning, with diminishing returns and a nudge if too thin.
    scores["historyTaking"] += min(12, len(questions) * 2)
    if len(questions) < 4:
        missed.append(_highlight(
            "The consultation was short",
            "Four to eight focused questions is typical before committing to a plan. You reached a "
            "decision with fewer.",
        ))
        scores["clinicalReasoning"] -= 6

    critical_found = [i for i in rule["criticalFactIds"] if i in revealed_ids]
    scores["clinicalReasoning"] += len(critical_found) * 7
    if rule["criticalFactIds"] and len(critical_found) == len(rule["criticalFactIds"]):
        strengths.append(_highlight(
            "Identified an important safety concern",
            "You uncovered every detail that materially changes management in this case.",
        ))

    # --- Recommendation and reasoning ---------------------------------------
    recommendation = attempt.get("recommendation")
    if recommendation:
        choice = recommendation["choice"]
        reasoning = recommendation["reasoning"]

        if choice in rule["preferredRecommendations"]:
            scores["clinicalReasoning"] += 14
            scores["medicationSafety"] += 10
            strengths.append(_highlight(
                "Chose a defensible option",
                f"{LQUO}{choice}{RQUO} is an appropriate course of action for this patient.",
            ))
        else:
            scores["clinicalReasoning"] -= 8

        if len(reasoning.strip()) > 80:
            scores["clinicalReasoning"] += 10
            strengths.append(_highlight(
                "Explained your reasoning",
                "You justified the decision rather than only naming a product.",
            ))
        elif len(reasoning.strip()) > 0:
            scores["clinicalReasoning"] += 4
            missed.append(_highlight(
                "Your reasoning was brief",
                "Spelling out why you excluded the alternatives is what an examiner marks. Name the "
                "risk you were avoiding.",
            ))

        for unsafe in rule["unsafeRecommendations"]:
            if choice not in unsafe["choices"]:
                continue
            gate = unsafe.get("requiresFacts") or []
            if gate and not any(i in revealed_ids for i in gate):
                continue
            safety_issues.append({
                "id": _uid("si"), "severity": "critical", "title": unsafe["title"],
                "what": unsafe["what"], "why": unsafe["why"],
            })
            scores["medicationSafety"] -= 26
            scores["clinicalReasoning"] -= 10

        # Recommending before uncovering the safety-critical facts is its own error.
        critical_missing = [i for i in rule["criticalFactIds"] if i not in revealed_ids]
        if critical_missing and not safety_issues:
            labels = [f["label"].lower() for f in patient["facts"] if f["id"] in critical_missing]
            safety_issues.append({
                "id": _uid("si"), "severity": "warning",
                "title": "Decision made with incomplete information",
                "what": f"You committed to a plan without establishing {', '.join(labels)}.",
                "why": "A recommendation is only as safe as the history behind it. Uncovering these "
                       "first would not have changed how long the consultation took, but it would "
                       "have changed how defensible the decision was.",
            })
            scores["medicationSafety"] -= 8
    else:
        missed.append(_highlight(
            "No recommendation was recorded",
            "Patients need a decision, not only questions. Commit to a course of action and say why.",
        ))
        scores["clinicalReasoning"] -= 12

    # --- Counseling ----------------------------------------------------------
    if counseling.strip():
        scores["counseling"] += 18
        hits = [m for m in COUNSELING_MARKERS if matches_any(counseling, m["keys"])]
        scores["counseling"] += len(hits) * 7
        if len(hits) >= 3:
            joined = ", ".join(h["label"] for h in hits)
            strengths.append(_highlight(
                "Counselled thoroughly",
                f"You {joined} {DASH} the patient can act on this.",
            ))
        else:
            missed.append(_highlight(
                "Counselling could be more complete",
                "Aim to cover four things every time: what it is, how to take it, the daily maximum, "
                "and when to come back.",
            ))
        if len(counseling.strip()) > 220:
            scores["communication"] += 6
    else:
        missed.append(_highlight(
            "The patient left without counselling",
            "Even a referral needs counselling: what you found, what happens next, and what to watch "
            "for meanwhile.",
        ))
        scores["counseling"] -= 14

    # --- Referral ------------------------------------------------------------
    referral = attempt.get("referral")
    if referral:
        if referral["choice"] in rule["expectedReferrals"]:
            scores["referralDecisions"] += 22
            strengths.append(_highlight(
                "Referral decision was appropriate",
                f"{LQUO}{referral['choice']}{RQUO} matches the risk you uncovered.",
            ))
        else:
            scores["referralDecisions"] -= 14
            missed.append(_highlight(
                "Referral urgency did not match the findings",
                "Match the level to the risk: emergency for red flags now, urgent for suspected "
                "serious pathology, routine for review.",
            ))
        if len(referral["reasoning"].strip()) > 40:
            scores["referralDecisions"] += 8
    else:
        scores["referralDecisions"] -= 6
        missed.append(_highlight(
            "No explicit referral decision",
            "Deciding that referral is *not* needed is still a decision. State it, so the patient "
            "knows where they stand.",
        ))

    # --- Communication -------------------------------------------------------
    confused_turns = len([m for m in attempt["messages"] if m.get("tone") == "confused"])
    if confused_turns > 0:
        scores["communication"] -= confused_turns * 7
        plural = "s" if confused_turns > 1 else ""
        missed.append(_highlight(
            "Clinical terminology lost the patient",
            f"The patient told you {confused_turns} time{plural} that they did not follow a term you "
            "used. Swap in everyday words.",
        ))
    else:
        scores["communication"] += 8

    if matches_any(question_text + " " + counseling, EMPATHY_MARKERS):
        scores["communication"] += 12
        strengths.append(_highlight(
            "Communicated clearly and warmly",
            "You acknowledged how the patient felt before working through your questions.",
        ))
    else:
        missed.append(_highlight(
            "Little explicit empathy",
            f"One sentence acknowledging the patient{APOS}s concern measurably improves how much of "
            "your advice they retain.",
        ))

    if len(attempt["notes"].strip()) > 40:
        scores["clinicalReasoning"] += 5
        strengths.append(_highlight(
            "Documented your findings",
            "You kept clinical notes during the consultation.",
        ))

    return {"scores": scores, "strengths": strengths, "missed": missed, "safetyIssues": safety_issues}


def _headline_for(total: int, has_critical: bool) -> tuple[str, str]:
    if has_critical:
        return (
            "Safety issue identified",
            "A decision was reached, but the safety issue below would have changed the outcome at a "
            "real counter. Review it before repeating the case.",
        )
    if total >= 85:
        return (
            "Strong consultation",
            "Structured questioning and a well-justified decision. The history covered the findings "
            "this case depends on.",
        )
    if total >= 70:
        return (
            "Competent consultation",
            "Sound clinical reasoning. More depth in the history would raise the score further.",
        )
    if total >= 55:
        return (
            "Adequate, with gaps",
            "The decision was reasonable but the history was thin. Spend longer at the questioning "
            "stage.",
        )
    return (
        "Significant gaps",
        "Key findings were not uncovered before a decision was made. Repeat the case and lead with "
        "the safety questions.",
    )


def compute_evaluation(attempt: dict, scenario: dict, patient: dict) -> dict:
    """Produce the full report for a finished attempt."""
    slug = scenario["slug"]
    rule = rule_for(slug)
    sheet = _score(attempt, slug, patient)

    score_list = [
        {
            "key": key,
            "label": COMPETENCY_LABELS[key],
            "score": round(clamp(sheet["scores"][key], 12, 100)),
        }
        for key in WEIGHTS
    ]
    total = round(sum(item["score"] * WEIGHTS[item["key"]] for item in score_list))

    has_critical = any(i["severity"] == "critical" for i in sheet["safetyIssues"])
    headline, summary = _headline_for(total, has_critical)

    return {
        "attemptId": attempt["id"],
        "scenarioId": slug,
        "scenarioTitle": scenario["title"],
        "totalScore": min(total, 68) if has_critical else total,
        "headline": headline,
        "summary": summary,
        "scores": score_list,
        "strengths": sheet["strengths"][:6],
        "missed": sheet["missed"][:6],
        "safetyIssues": sheet["safetyIssues"],
        "timeline": _build_timeline(attempt, patient, sheet["safetyIssues"]),
        "betterApproach": rule["betterApproach"],
        "nextScenarioId": rule["nextScenarioId"],
        "nextScenarioReason": rule["nextScenarioReason"],
        "createdAt": datetime.now(timezone.utc).isoformat(),
        "stages": EVALUATION_STAGES,
    }
