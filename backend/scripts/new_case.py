"""
Scaffold a new consultation case.

    cd backend
    python -m scripts.new_case --slug sc_sore_throat --patient "Amir Haddad" --age 24

Writes a fully-structured case into `scripts/data/catalogue.json` with the
clinical content left as TODO markers, then tells you what to fill in. Adding a
case is data entry: no engine change, no code change.

The shared trigger vocabulary below is attached automatically, so a new patient
answers the same range of phrasings students already use for allergies,
medication and history.
"""

import argparse
import json
import sys
from pathlib import Path

CATALOGUE = Path(__file__).parent / "data" / "catalogue.json"

TODO = "TODO"

# Phrasings students actually use. Every new case inherits these, so authors
# only add triggers that are specific to their own scenario.
SHARED_TRIGGERS = {
    "allergies": [
        "allerg", "allergic", "react to any", "intolerance", "sensitive to any drug",
        "reaction to", "anything you cannot take", "anything you can t take", "adverse reaction",
    ],
    "medications": [
        "medication", "medicine", "medicines", "taking any", "tablets", "prescription",
        "supplements", "what do you take", "anything from the doctor", "on any",
        "currently take", "regular medic", "take anything regularly", "over the counter",
    ],
    "history": [
        "medical history", "medical condition", "conditions", "health problems",
        "past illness", "diagnosed", "been treated", "operations", "surgery",
        "any conditions", "medical problem", "seen a doctor", "anything ongoing",
        "other illness", "long term condition",
    ],
    "duration": ["how long", "when did it start", "since when", "duration", "started"],
    "severity": ["how bad", "severity", "scale of", "how severe", "how painful", "rate the pain"],
    "pregnancy": ["pregnan", "breastfeed", "nursing", "baby on the way"],
}

COMPETENCIES = [
    "historyTaking", "clinicalReasoning", "medicationSafety",
    "counseling", "communication", "referralDecisions",
]


def _fact(slug: str, section: str, label: str, *, credits: str,
          triggers: list[str] | None = None, revealed_at_start: bool = False,
          safety_critical: bool = False) -> dict:
    return {
        "id": slug,
        "section": section,
        "label": label,
        "value": TODO,
        "revealedAtStart": revealed_at_start,
        "triggers": triggers if triggers is not None else [],
        "patientLine": TODO,
        "credits": credits,
        **({"safetyCritical": True} if safety_critical else {}),
    }


def build_patient(patient_slug: str, name: str, age: int) -> dict:
    """A patient with the standard fact skeleton every case needs."""
    prefix = patient_slug.replace("pat_", "")

    return {
        "id": patient_slug,
        "name": name,
        "age": age,
        "pronouns": TODO,
        "role": "Patient",
        "mood": "worried",
        "avatar": "sarah",
        "chiefComplaint": TODO,
        "openingLine": TODO,
        "facts": [
            _fact(f"{prefix}_age", "basic", "Age", credits="historyTaking",
                  triggers=["age", "how old"], revealed_at_start=True) | {"value": str(age)},
            _fact(f"{prefix}_complaint", "basic", "Chief complaint", credits="historyTaking",
                  triggers=["what brings you", "problem", "complaint"], revealed_at_start=True),
            _fact(f"{prefix}_duration", "symptoms", "Duration", credits="historyTaking",
                  triggers=SHARED_TRIGGERS["duration"]),
            _fact(f"{prefix}_severity", "symptoms", "Severity", credits="historyTaking",
                  triggers=SHARED_TRIGGERS["severity"]),
            _fact(f"{prefix}_redflags", "symptoms", "Red flags", credits="clinicalReasoning",
                  triggers=[TODO]),
            _fact(f"{prefix}_allergy", "allergies", "Allergy", credits="medicationSafety",
                  triggers=SHARED_TRIGGERS["allergies"], safety_critical=True),
            _fact(f"{prefix}_meds", "medications", "Current medication", credits="medicationSafety",
                  triggers=SHARED_TRIGGERS["medications"], safety_critical=True),
            _fact(f"{prefix}_history", "history", "Medical history", credits="medicationSafety",
                  triggers=SHARED_TRIGGERS["history"]),
            _fact(f"{prefix}_tried", "other", "Tried so far", credits="historyTaking",
                  triggers=["tried", "taken anything", "anything for it", "so far"]),
            _fact(f"{prefix}_pregnancy", "other", "Pregnancy status", credits="historyTaking",
                  triggers=SHARED_TRIGGERS["pregnancy"]),
        ],
        "deflections": [
            "Sorry, I'm not sure what you mean — could you put it another way?",
            "I don't think so? Nobody's ever asked me that.",
            "Hmm. I'm not sure that's related, but ask me whatever you need.",
        ],
        "impatientLines": [TODO],
        "followUps": [{"triggers": [TODO], "line": TODO}],
        "jargon": [TODO],
    }


def build_scenario(slug: str, patient_slug: str, title: str) -> dict:
    return {
        "id": slug,
        "title": title,
        "tagline": TODO,
        "description": TODO,
        "mission": TODO,
        "category": TODO,
        "setting": "Community Pharmacy",
        "difficulty": "Intermediate",
        "durationMinutes": [8, 10],
        "skills": [TODO],
        "objectives": [TODO],
        "status": "not-started",
        "patientId": patient_slug,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Scaffold a new consultation case.")
    parser.add_argument("--slug", required=True, help="Scenario slug, e.g. sc_sore_throat")
    parser.add_argument("--patient", required=True, help="Patient name, e.g. 'Amir Haddad'")
    parser.add_argument("--age", required=True, type=int)
    parser.add_argument("--title", help="Scenario title (defaults to a TODO)")
    args = parser.parse_args()

    if not args.slug.startswith("sc_"):
        print("Slug must start with 'sc_' (e.g. sc_sore_throat).", file=sys.stderr)
        return 1

    data = json.loads(CATALOGUE.read_text(encoding="utf-8"))

    if any(s["id"] == args.slug for s in data["scenarios"]):
        print(f"Scenario {args.slug} already exists.", file=sys.stderr)
        return 1

    first_name = args.patient.split()[0].lower()
    patient_slug = f"pat_{first_name}"
    if any(p["id"] == patient_slug for p in data["patients"]):
        print(f"Patient {patient_slug} already exists.", file=sys.stderr)
        return 1

    data["patients"].append(build_patient(patient_slug, args.patient, args.age))
    data["scenarios"].append(build_scenario(args.slug, patient_slug, args.title or TODO))

    CATALOGUE.write_text(json.dumps(data, indent=1, ensure_ascii=False), encoding="utf-8")

    print(f"Scaffolded {args.slug} with patient {patient_slug}.\n")
    print("Now fill in every TODO in scripts/data/catalogue.json:")
    print("  · scenario  — title, tagline, description, mission, category, skills, objectives")
    print("  · patient   — pronouns, chiefComplaint, openingLine, jargon, impatientLines")
    print("  · facts     — value and patientLine for each; triggers for red flags")
    print("  · followUps — what the patient asks back when a product is named\n")
    print("Then add a scoring rule for the case in app/engine/rules.py:")
    print("  · unsafeRecommendations  — what is dangerous here, and why")
    print("  · preferredRecommendations / expectedReferrals")
    print("  · criticalFactIds        — what a safe consultation must uncover\n")
    print("Finally:  python -m scripts.seed_catalogue")
    print("Validate: python -m scripts.check_catalogue")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
