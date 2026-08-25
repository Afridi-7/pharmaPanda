"""
Validate the case catalogue.

    cd backend
    python -m scripts.check_catalogue

Catches the authoring mistakes that are invisible until a student hits them:
unfilled TODOs, a fact no question can unlock, a scenario with no scoring rule,
and triggers so short they fire inside unrelated words.
"""

import json
import sys
from pathlib import Path

from app.engine.rules import RULES
from app.engine.text import matches_any, normalise

CATALOGUE = Path(__file__).parent / "data" / "catalogue.json"

# A trigger this short matches as a whole word only, which is usually not what
# an author intends for a clinical topic.
MIN_USEFUL_TRIGGER = 4

REQUIRED_SECTIONS = {"allergies", "medications", "history"}


def main() -> int:
    data = json.loads(CATALOGUE.read_text(encoding="utf-8"))
    problems: list[str] = []
    warnings: list[str] = []

    patients = {p["id"]: p for p in data["patients"]}

    for scenario in data["scenarios"]:
        slug = scenario["id"]

        for field, value in scenario.items():
            if value == "TODO" or (isinstance(value, list) and "TODO" in value):
                problems.append(f"{slug}: scenario field '{field}' is still TODO")

        if scenario["patientId"] not in patients:
            problems.append(f"{slug}: references unknown patient {scenario['patientId']}")
            continue

        if slug not in RULES:
            problems.append(
                f"{slug}: no scoring rule in app/engine/rules.py — "
                f"the case cannot be marked"
            )

    for patient in data["patients"]:
        pid = patient["id"]

        for field in ("pronouns", "chiefComplaint", "openingLine"):
            if patient.get(field) == "TODO":
                problems.append(f"{pid}: '{field}' is still TODO")

        sections = set()
        for fact in patient["facts"]:
            fid = fact["id"]
            sections.add(fact["section"])

            if fact["value"] == "TODO" or fact["patientLine"] == "TODO":
                problems.append(f"{pid}/{fid}: value or patientLine is still TODO")

            if fact["revealedAtStart"]:
                continue

            triggers = [t for t in fact["triggers"] if t and t != "TODO"]
            if not triggers:
                problems.append(
                    f"{pid}/{fid}: hidden fact with no usable triggers — "
                    f"no question can ever reveal it"
                )
                continue

            for trigger in triggers:
                if len(normalise(trigger)) < MIN_USEFUL_TRIGGER and " " not in trigger:
                    warnings.append(
                        f"{pid}/{fid}: trigger '{trigger}' is very short and will "
                        f"only match as a whole word"
                    )

        missing = REQUIRED_SECTIONS - sections
        if missing:
            warnings.append(
                f"{pid}: no {', '.join(sorted(missing))} fact — students are "
                f"scored on asking about these"
            )

        # A question that unlocks two safety-critical facts at once usually
        # means overlapping triggers, which makes marking unpredictable.
        for fact in patient["facts"]:
            if fact["revealedAtStart"]:
                continue
            probe = fact["triggers"][0] if fact["triggers"] else None
            if not probe or probe == "TODO":
                continue
            also = [
                other["id"]
                for other in patient["facts"]
                if other["id"] != fact["id"]
                and not other["revealedAtStart"]
                and matches_any(probe, other["triggers"])
            ]
            if len(also) > 1:
                warnings.append(
                    f"{pid}/{fact['id']}: trigger '{probe}' also matches {', '.join(also)}"
                )

    for line in warnings:
        print(f"  warning  {line}")
    for line in problems:
        print(f"  ERROR    {line}", file=sys.stderr)

    scenarios, facts = len(data["scenarios"]), sum(len(p["facts"]) for p in data["patients"])
    print(
        f"\n{scenarios} scenarios, {len(data['patients'])} patients, {facts} facts · "
        f"{len(problems)} error(s), {len(warnings)} warning(s)"
    )
    return 1 if problems else 0


if __name__ == "__main__":
    raise SystemExit(main())
