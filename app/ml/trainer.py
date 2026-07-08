from __future__ import annotations
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from .model import artifacts
from .featurizer import (
    build_features_for_soreness,
    build_features_for_suitability,
    synthesize_suitability_label,
)


def user_stats_from_runs(run_rows: list[dict]) -> dict:
    if not run_rows:
        return {"avg_pace_min_per_km": 5.5, "avg_elev_gain": 90.0, "fitness_level": 5.0, "recent_volume_km": 30.0}
    paces = [60.0 / max(r.get("avg_speed", 10.0), 0.1) for r in run_rows]
    elevs = [r.get("avg_elevation", 0.0) for r in run_rows]
    vol = sum(r.get("distance_km", 0.0) for r in run_rows)
    fitness = max(0.0, min(10.0, 10.0 - (float(np.mean(paces)) - 4.0)))
    return {
        "avg_pace_min_per_km": float(np.mean(paces)),
        "avg_elev_gain": float(np.mean(elevs)),
        "fitness_level": float(fitness),
        "recent_volume_km": float(vol),
    }


def train_soreness_model(run_rows: list[dict]) -> None:
    if not run_rows:
        return
    X, y = build_features_for_soreness(run_rows)
    model = RandomForestRegressor(n_estimators=180, random_state=42)
    model.fit(X, y)
    artifacts.soreness = model
    artifacts.save()


def train_suitability_model(run_rows: list[dict], route_rows: list[dict]) -> None:
    """Bootstrap a sklearn route-suitability regressor.

    Uses each historical run as an implicit "ridden" route and pairs it against
    every candidate route under the synthesized contexts (jog/light/mid/marathon
    x elevation prefs). Labels come from `synthesize_suitability_label` until
    real user feedback accumulates; the model then retrains on whatever labels
    exist, which is what makes the recommendations adaptive over time.
    """
    if not route_rows:
        return

    user_stats = user_stats_from_runs(run_rows)
    candidates: list[dict] = list(route_rows)
    if run_rows:
        candidates += [
            {"distance_km": r["distance_km"], "elevation_gain": r["avg_elevation"]}
            for r in run_rows
        ]

    feelings = ["jog", "light", "mid", "marathon"]
    elev_prefs = ["flat", "up", "down"]

    X_rows, y_rows = [], []
    for feeling in feelings:
        for pref in elev_prefs:
            for rushed in (False, True):
                context = {
                    "feeling": feeling,
                    "pref_elevation": pref,
                    "rushed": rushed,
                    "adventure_level": 0.3,
                    "day_of_week": 3,
                }
                for c in candidates:
                    feats = build_features_for_suitability(context, c, user_stats)
                    X_rows.append(feats)
                    y_rows.append(synthesize_suitability_label(feats))

    if not X_rows:
        return

    X = np.array(X_rows, dtype=float)
    y = np.array(y_rows, dtype=float)
    model = RandomForestRegressor(n_estimators=160, random_state=42)
    model.fit(X, y)
    artifacts.suitability = model
    artifacts.save()
