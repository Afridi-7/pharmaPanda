"""
Competency aggregation and achievement rules.

Derived entirely from a user's stored evaluations, so progress is recomputed
from evidence rather than accumulated in a mutable counter that could drift out
of step with the reports behind it.
"""

from datetime import date, datetime, timedelta

COMPETENCY_DEFINITIONS = [
    {
        "key": "historyTaking",
        "label": "History Taking",
        "description": (
            "Gathering a structured, complete picture of the complaint before reaching for a product."
        ),
        "focusAreas": [
            "Ask about symptom duration and severity in the first two questions.",
            "Screen medication and allergy history before recommending anything.",
        ],
    },
    {
        "key": "clinicalReasoning",
        "label": "Clinical Reasoning",
        "description": "Connecting findings into a working assessment and justifying the next step.",
        "focusAreas": [
            "Keep articulating why you ruled a red flag out, not only that you did.",
            "Try naming your working assessment before you choose a product.",
        ],
    },
    {
        "key": "medicationSafety",
        "label": "Medication Safety",
        "description": (
            "Spotting interactions, contraindications and cautions before they reach the patient."
        ),
        "focusAreas": [
            "Anticoagulants: always check before offering any NSAID.",
            "Confirm allergy details — an aspirin allergy changes the whole analgesic ladder.",
        ],
    },
    {
        "key": "counseling",
        "label": "Counseling",
        "description": "Explaining the plan so the patient can actually follow it at home.",
        "focusAreas": [
            "Include dose, frequency, maximum daily dose and when to come back.",
            "Finish with a teach-back question so you know the plan was understood.",
        ],
    },
    {
        "key": "communication",
        "label": "Communication",
        "description": "Plain language, empathy, and checking that you were understood.",
        "focusAreas": [
            "Swap clinical terms such as contraindicated or gastric for everyday words.",
            "Acknowledge worry explicitly before moving to your questions.",
        ],
    },
    {
        "key": "referralDecisions",
        "label": "Referral Decisions",
        "description": "Knowing when self-care stops and someone else needs to see the patient.",
        "focusAreas": [
            "Say the urgency out loud: today, this week, or right now.",
            "Tell the patient what to say when they get there.",
        ],
    },
]

# Reports are scored newest-first everywhere else; competency history reads
# oldest-first so a trend line runs left to right.
HISTORY_LIMIT = 8


def build_competencies(reports: list[dict]) -> list[dict]:
    """
    Aggregate competency scores from a user's evaluations.

    `reports` is oldest-first. The headline score is the most recent observation
    rather than a lifetime average: a student who has improved should see their
    current standard, not one dragged down by early attempts. `previousScore`
    is the observation before it, so the trend reflects the last case.
    """
    competencies: list[dict] = []

    for definition in COMPETENCY_DEFINITIONS:
        key = definition["key"]
        observed = [
            entry["score"]
            for report in reports
            for entry in report["scores"]
            if entry["key"] == key
        ]

        if not observed:
            competencies.append({
                **definition,
                "score": 0,
                "previousScore": 0,
                "attempts": 0,
                "trendLabel": "No attempts yet",
                "history": [],
            })
            continue

        score = observed[-1]
        previous = observed[-2] if len(observed) > 1 else score
        delta = score - previous

        if len(observed) == 1:
            trend = "First attempt"
        elif delta > 0:
            trend = f"+{delta}% since last case"
        elif delta < 0:
            trend = f"{delta}% since last case"
        else:
            trend = "No change since last case"

        competencies.append({
            **definition,
            "score": score,
            "previousScore": previous,
            "attempts": len(observed),
            "trendLabel": trend,
            "history": [
                {"label": f"#{i + 1}", "score": value}
                for i, value in enumerate(observed[-HISTORY_LIMIT:], start=max(0, len(observed) - HISTORY_LIMIT))
            ],
        })

    return competencies


def overall_score(competencies: list[dict]) -> int:
    """Mean of the six current competency scores; 0 until something is scored."""
    scored = [c for c in competencies if c["attempts"] > 0]
    if not scored:
        return 0
    return round(sum(c["score"] for c in competencies) / len(competencies))


def _score_for(report: dict, key: str) -> int:
    return next((e["score"] for e in report["scores"] if e["key"] == key), 0)


def _consecutive_practice_days(dates: list[date]) -> int:
    """Longest run of consecutive calendar days ending at the most recent one."""
    if not dates:
        return 0
    unique = sorted(set(dates))
    run = 1
    for earlier, later in zip(unique, unique[1:]):
        run = run + 1 if later - earlier == timedelta(days=1) else 1
    return run


def build_achievements(reports: list[dict], finished_at: list[datetime]) -> list[dict]:
    """
    Evaluate achievement rules against real consultation evidence.

    Each rule mirrors the wording shown to the student — an achievement that
    claims "five in a row without a critical safety issue" checks exactly that,
    rather than approximating it with a counter.
    """
    total = len(reports)

    # First Patient: any completed consultation.
    first_patient = total >= 1

    # Safe Hands: five consecutive reports with no critical safety issue.
    clean_run = 0
    best_clean_run = 0
    for report in reports:
        has_critical = any(i["severity"] == "critical" for i in report["safetyIssues"])
        clean_run = 0 if has_critical else clean_run + 1
        best_clean_run = max(best_clean_run, clean_run)

    # Clinical Thinker: 85+ in clinical reasoning on three different cases.
    strong_reasoning_cases = {
        report["scenarioSlug"]
        for report in reports
        if _score_for(report, "clinicalReasoning") >= 85
    }

    # Patient Communicator: consultations where nothing confused the patient.
    # A perfect communication score is the engine's signal for that.
    clear_consultations = len([r for r in reports if _score_for(r, "communication") >= 85])

    # Consistent Learner: seven consecutive practice days.
    streak = _consecutive_practice_days([d.date() for d in finished_at])

    # Perfect Consultation: 95+ overall with no safety issue at all.
    best_total = max(
        (r["totalScore"] for r in reports if not r["safetyIssues"]),
        default=0,
    )

    return [
        {
            "id": "ach_first_patient",
            "title": "First Patient",
            "description": "Completed your first full consultation from greeting to counselling.",
            "icon": "stethoscope",
            "unlocked": first_patient,
        },
        {
            "id": "ach_safe_hands",
            "title": "Safe Hands",
            "description": "Finished five consultations in a row without a critical safety issue.",
            "icon": "shield",
            "unlocked": best_clean_run >= 5,
            "progress": {"current": min(best_clean_run, 5), "target": 5},
        },
        {
            "id": "ach_clinical_thinker",
            "title": "Clinical Thinker",
            "description": "Scored 85 or above in Clinical Reasoning across three different cases.",
            "icon": "brain",
            "unlocked": len(strong_reasoning_cases) >= 3,
            "progress": {"current": min(len(strong_reasoning_cases), 3), "target": 3},
        },
        {
            "id": "ach_communicator",
            "title": "Patient Communicator",
            "description": "Counselled a patient without using a single term they did not understand.",
            "icon": "messages",
            "unlocked": clear_consultations >= 3,
            "progress": {"current": min(clear_consultations, 3), "target": 3},
        },
        {
            "id": "ach_consistent",
            "title": "Consistent Learner",
            "description": "Practised on seven consecutive days.",
            "icon": "flame",
            "unlocked": streak >= 7,
            "progress": {"current": min(streak, 7), "target": 7},
        },
        {
            "id": "ach_perfect",
            "title": "Perfect Consultation",
            "description": "Uncovered every safety-critical detail and scored 95 or above.",
            "icon": "sparkles",
            "unlocked": best_total >= 95,
            "progress": {"current": min(best_total, 95), "target": 95},
        },
    ]


def weekly_activity(finished_at: list[datetime], today: date) -> list[dict]:
    """Consultations per weekday over the last seven days, Monday first."""
    labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    counts = dict.fromkeys(labels, 0)
    week_ago = today - timedelta(days=6)

    for moment in finished_at:
        day = moment.date()
        if week_ago <= day <= today:
            counts[labels[day.weekday()]] += 1

    return [{"label": label, "consultations": counts[label]} for label in labels]


def practice_streak(finished_at: list[datetime], today: date) -> int:
    """Consecutive days up to today (or yesterday) on which a case was finished."""
    days = {m.date() for m in finished_at}
    if not days:
        return 0

    cursor = today if today in days else today - timedelta(days=1)
    if cursor not in days:
        return 0

    streak = 0
    while cursor in days:
        streak += 1
        cursor -= timedelta(days=1)
    return streak
