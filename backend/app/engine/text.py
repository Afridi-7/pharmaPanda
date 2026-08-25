"""
Text helpers.

These decide which facts a question unlocks, so their behaviour is the
difference between a patient who answers sensibly and one who does not.
"""

import re

_NON_ALNUM = re.compile(r"[^a-z0-9\s]")
_WHITESPACE = re.compile(r"\s+")

# Keywords at or below this length must match whole words. Without this, "hi"
# matches inside "this"/"which"/"anything" and turns ordinary clinical
# questions into greetings.
_SHORT_KEYWORD = 4


def normalise(text: str) -> str:
    """Lowercase, strip punctuation to spaces, collapse whitespace, trim."""
    lowered = text.lower()
    lowered = _NON_ALNUM.sub(" ", lowered)
    return _WHITESPACE.sub(" ", lowered).strip()


def matches_any(text: str, keywords: list[str]) -> bool:
    """
    Match a question against trigger keywords.

    Two rules, and the split matters:

    * Short keywords ("hi", "hot", "call") match only as whole words. They are
      common letter sequences and would otherwise fire inside longer words.
    * Longer keywords match as a prefix of a word, so authored stems such as
      "allerg" still catch "allergy", "allergies" and "allergic", and
      "medication" catches "medications".
    """
    haystack = f" {normalise(text)} "

    for keyword in keywords:
        needle = normalise(keyword)
        if not needle:
            continue

        # Multi-word phrases are matched literally.
        if " " in needle:
            if f" {needle} " in haystack or needle in haystack:
                return True
            continue

        if len(needle) <= _SHORT_KEYWORD:
            if f" {needle} " in haystack:
                return True
            continue

        # Prefix-of-a-word match: " allerg" catches "allergies".
        if f" {needle}" in haystack:
            return True

    return False


def pick(items: list, seed: int):
    """Deterministic choice; mirrors `items[Math.abs(seed) % items.length]`."""
    if not items:
        raise ValueError("pick() needs at least one item")
    return items[abs(seed) % len(items)]


def score_band(score: int) -> dict:
    if score >= 85:
        return {"label": "Strong", "tone": "strong"}
    if score >= 70:
        return {"label": "Solid", "tone": "solid"}
    if score >= 55:
        return {"label": "Developing", "tone": "developing"}
    return {"label": "Needs work", "tone": "attention"}


def clamp(value: float, low: float = 0, high: float = 100) -> float:
    return min(high, max(low, value))
