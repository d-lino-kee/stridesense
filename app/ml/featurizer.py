from __future__ import annotations
import numpy as np
from typing import Iterable

# Feature builder for both route suitability and soreness prediction

def build_features_for_soreness(runs: Iterable[dict]) -> tuple[np.ndarray, np.ndarray]:
    X, y = [], []
    for r in runs:
        X.append([
            r.get("distance_km": 0.0),
            r.get("avg_speed", 0.0),
            r.get("avg_elevation", 0.0),
            int(r.get("rushed", False))
            # encode run_type roughly
            1 if r.get("run_type") == "jog" else 2 if r.get("run_type") == "light" else 3 if r.get("run_type") == "mid" else 4
            r.get("day_of_week", 0),                
        ])
        y.append(float(r.get("soreness_level", 3)))
    return np.array(X, dtype=float), np.array(y, dtype=float)

def build_features_for_suitability(context: dict, candidate: dict, user_stats: dict) -> np.ndarray:
    # Context: feeling, rushed, adventure_level, time_available, season, day_of_week
    feeling_map = {"jog": 1, "light": 2, "mid": 3, "marathon": 4}
    feeling_val = feeling_map.get(context.get("feeling"), 2)

    # Distance alignment target by feeling
    target_dist = {1: 4, 2: 6.5, 3: 9, 4:18}.get(feeling_val, 7)
    dist = float(candidate.get("distance_km", 0))
    elev = float(candidate.get("elevation_gain", 0))

    return np.array([
        dist,
        elev,
        abs(dist - target_dist),
        float(context.get("adventure_level", 0.3)),
        int(bool(context.get("rushed"))),
        user_stats.get("avg_pace_min_per_km", 5.5),
        user_stats.get("avg_elev_gain", 90.0),
        feeling_val,
        context.get("day_of_week", 0),
    ], dtype = float)