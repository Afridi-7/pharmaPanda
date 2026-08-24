"""
Load the scenario and patient catalogue into PostgreSQL.

    cd backend
    python -m scripts.seed_catalogue [path/to/catalogue.json]

Catalogue rows are authored course content, identical for every student, so the
script is idempotent: existing rows are updated in place by slug rather than
duplicated. Attempts reference scenarios by id, so rows are never deleted.

The default source is `scripts/data/catalogue.json`, exported from the original
frontend data modules.
"""

import json
import sys
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models.catalogue import Patient, PatientFact, Scenario

DEFAULT_SOURCE = Path(__file__).parent / "data" / "catalogue.json"


def _upsert_patient(db: Session, raw: dict) -> Patient:
    patient = db.execute(
        select(Patient).where(Patient.slug == raw["id"])
    ).scalar_one_or_none()

    if patient is None:
        patient = Patient(slug=raw["id"])
        db.add(patient)

    patient.name = raw["name"]
    patient.age = raw["age"]
    patient.pronouns = raw["pronouns"]
    patient.role = raw["role"]
    patient.mood = raw["mood"]
    patient.avatar = raw["avatar"]
    patient.chief_complaint = raw["chiefComplaint"]
    patient.opening_line = raw["openingLine"]
    patient.deflections = raw["deflections"]
    patient.impatient_lines = raw["impatientLines"]
    patient.jargon = raw["jargon"]
    patient.follow_ups = raw["followUps"]

    # Replace facts wholesale: they are content, and orphan removal keeps the
    # table consistent if a fact is dropped from the source.
    existing = {f.slug: f for f in patient.facts}
    seen: set[str] = set()

    for position, fact_raw in enumerate(raw["facts"]):
        slug = fact_raw["id"]
        seen.add(slug)
        fact = existing.get(slug)
        if fact is None:
            fact = PatientFact(slug=slug)
            patient.facts.append(fact)

        fact.section = fact_raw["section"]
        fact.label = fact_raw["label"]
        fact.value = fact_raw["value"]
        fact.revealed_at_start = bool(fact_raw["revealedAtStart"])
        fact.triggers = fact_raw["triggers"]
        fact.patient_line = fact_raw["patientLine"]
        fact.credits = fact_raw["credits"]
        fact.safety_critical = bool(fact_raw.get("safetyCritical", False))
        fact.position = position

    for slug, fact in existing.items():
        if slug not in seen:
            patient.facts.remove(fact)

    return patient


def _upsert_scenario(db: Session, raw: dict, patient: Patient, position: int) -> Scenario:
    scenario = db.execute(
        select(Scenario).where(Scenario.slug == raw["id"])
    ).scalar_one_or_none()

    if scenario is None:
        scenario = Scenario(slug=raw["id"])
        db.add(scenario)

    scenario.title = raw["title"]
    scenario.tagline = raw["tagline"]
    scenario.description = raw["description"]
    scenario.mission = raw["mission"]
    scenario.category = raw["category"]
    scenario.setting = raw["setting"]
    scenario.difficulty = raw["difficulty"]
    scenario.duration_min = raw["durationMinutes"][0]
    scenario.duration_max = raw["durationMinutes"][1]
    scenario.skills = raw["skills"]
    scenario.objectives = raw["objectives"]
    scenario.position = position
    scenario.patient = patient

    return scenario


def main() -> int:
    source = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_SOURCE
    if not source.exists():
        print(f"Catalogue source not found: {source}", file=sys.stderr)
        return 1

    data = json.loads(source.read_text(encoding="utf-8"))

    with SessionLocal() as db:
        patients_by_slug: dict[str, Patient] = {}
        for raw in data["patients"]:
            patients_by_slug[raw["id"]] = _upsert_patient(db, raw)
        db.flush()

        for position, raw in enumerate(data["scenarios"]):
            patient = patients_by_slug.get(raw["patientId"])
            if patient is None:
                print(f"Scenario {raw['id']} references unknown patient {raw['patientId']}", file=sys.stderr)
                db.rollback()
                return 1
            _upsert_scenario(db, raw, patient, position)

        db.commit()

        patients = db.execute(select(Patient)).scalars().all()
        scenarios = db.execute(select(Scenario)).scalars().all()
        facts = sum(len(p.facts) for p in patients)

    print(f"Catalogue loaded: {len(scenarios)} scenarios, {len(patients)} patients, {facts} facts")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
