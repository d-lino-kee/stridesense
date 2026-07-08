from __future__ import annotations
from typing import Iterable
import numpy as np


RUN_TYPE_TO_INT = {"jog": 1, "light": 2, "mid": 3, "marathon": 4}
ELEV_PREF_TO_INT = {"flat": 0, "down": -1, "up": 1}


def _run_type_code(rt: str | None) -> int:
    return RUN_TYPE_TO_INT.get(rt or "", 2)


def build_features_for_soreness(runs: Iterable[dict]) -> tuple[np.ndarray, np.ndarray]:
    X, y = [], []
    for r in runs:
        X.append([
            r.get("distance_km", 0.0),
            r.get("avg_speed", 0.0),
            r.get("avg_elevation", 0.0),
            int(r.get("rushed", False)),
            _run_type_code(r.get("run_type")),
            r.get("day_of_week", 0),
        ])
        y.append(float(r.get("soreness_level", 3)))
    return np.array(X, dtype=float), np.array(y, dtype=float)


def build_features_for_suitability(
    context: dict,
    candidate: dict,
    user_stats: dict,
) -> np.ndarray:
    feeling_val = _run_type_code(context.get("feeling"))
    target_dist = {1: 4.0, 2: 6.5, 3: 9.0, 4: 18.0}.get(feeling_val, 7.0)
    dist = float(candidate.get("distance_km", 0.0))
    elev = float(candidate.get("elevation_gain", 0.0))
    pref_code = ELEV_PREF_TO_INT.get(context.get("pref_elevation") or "flat", 0)

    return np.array([
        dist,
        elev,
        abs(dist - target_dist),
        float(context.get("adventure_level", 0.3)),
        int(bool(context.get("rushed"))),
        float(user_stats.get("avg_pace_min_per_km", 5.5)),
        float(user_stats.get("avg_elev_gain", 90.0)),
        float(user_stats.get("fitness_level", 5.0)),
        float(user_stats.get("recent_volume_km", 30.0)),
        feeling_val,
        pref_code,
        context.get("day_of_week", 0),
    ], dtype=float)


def synthesize_suitability_label(features: np.ndarray) -> float:
    """Heuristic label used to bootstrap the sklearn model before user feedback exists."""
    (dist, elev, dist_gap, adventure, rushed, avg_pace,
     avg_elev, fitness, recent_vol, feeling_val, pref_code, _dow) = features

    score = 10.0
    score -= dist_gap * 0.6
    elev_delta = elev - avg_elev
    if pref_code == 1:
        score += min(2.0, elev_delta / 80.0)
    elif pref_code == -1:
        score -= max(0.0, elev_delta / 80.0)
    else:
        score -= abs(elev_delta) / 120.0
    if rushed:
        score -= max(0.0, dist - 5.0) * 0.3
    score += adventure * 1.5
    score += (fitness - 5.0) * 0.1
    score -= max(0.0, avg_pace - 6.5) * 0.2
    return float(max(0.0, min(10.0, score)))
