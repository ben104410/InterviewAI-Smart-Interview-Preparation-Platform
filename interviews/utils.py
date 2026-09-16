from typing import Any


def normalize_role(role: Any) -> str:
    if role is None:
        return ""
    return str(role).strip()


def clamp_score(score: Any, minimum: int = 0, maximum: int = 100) -> int:
    try:
        value = int(score)
    except (TypeError, ValueError):
        return minimum
    return max(minimum, min(maximum, value))
