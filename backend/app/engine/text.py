"""
Text helpers.

Ported from `src/lib/utils.ts`. The behaviour must match the TypeScript
character for character: these decide which facts a question unlocks, so any
divergence changes what patients disclose and therefore how students score.
"""

import re

_NON_ALNUM = re.compile(r"[^a-z0-9\s]")
_WHITESPACE = re.compile(r"\s+")


def normalise(text: str) -> str:
    """Lowercase, strip punctuation to spaces, collapse whitespace, trim."""
    lowered = text.lower()
    lowered = _NON_ALNUM.sub(" ", lowered)
    return _WHITESPACE.sub(" ", lowered).strip()


def matches_any(text: str, keywords: list[str]) -> bool:
    """
    Keyword match with the original's two-stage test.

    The TypeScript checks a space-padded match first and then a bare substring
    match, so a stem such as "allerg" still matches "allergies". Reproduced as
    written rather than tightened — changing it would alter which questions
    unlock which facts.
    """
    haystack = f" {normalise(text)} "
    for keyword in keywords:
        needle = normalise(keyword)
        if f" {needle} " in haystack or needle in haystack:
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
