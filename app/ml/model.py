from __future__ import annotations
import joblib
import os
from dataclasses import dataclass
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from .featurizer import build_features_for_soreness, build_features_for_suitability

MODELS_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "models")

@dataclass
class MLArtifacts:
    soreness: RandomForestRegressor

    def save(self):
        joblib.dump(self.soreness, os.path.join(MODELS_DIR, "soreness.pkl"))

    @staticmethod
    def load_or_init():
        path = os.path.join(MODELS_DIR, "soreness.pkl")
        if os.path.exists(path):
            return MLArtifacts(soreness=joblib.load(path))
        # Init a small model to avoid cold start issues; will retrain on seed
        return MLArtifacts(soreness=RandomForestRegressor(n_estimators=120, random_state=42))
    
    def predict_soreness(self, runs_like: list[dict]) -> float:
        X, _ = build_features_for_soreness(runs_like)
        if getattr(self.soreness, "n_features_in_", None) is None:
            # Model not trained yet; naive heuristic fallback
            baseline = np.mean([r.get("soreness_level", 3) for r in runs_like]) if runs_like else 3.0
            return float(round(baseline, 2))
        pred = float(self.soreness.predict([X[-1]])[0])
        return max(1.0, min(10.0, round(pred, 2)))
    
    def rank_candidates(self, context: dict, candidates: list[dict], user_stats: dict) -> list[tuple[dict,float]]:
        scored: list[tuple[dict, float]] = []
        # Simple deterministic scoring that prefers distance alignment, lower elevation if rushed, novelty
        for c in candidates:
            x = build_features_for_suitability(context, c, user_stats)
            dist, elev, dist_gap, adventure, rushed, avg_pace, avg_elev, feeling_val, dow = x
            score = 0.0
            # Distance alignment
            score += max(0, 10 - dist_gap) * 0.6
            # elevation penalty (unless user prefers up)
            if context.get("pref_elevation") == "up":
                score += min(10, elev / 50.0) * 0.2
            elif context.get("pref_elevation") == "down":
                score += max(0, 5 - elev /80.0 * 0.2)
            else: 
                score += max(0, 6 - elev /80.0) * 0.2
            
            # Rushed -> Prefer shorter
            if rushed:
                score += max(0, 6 - elev / 80.0) * 0.2
            # Novelty (adventure)
            score += adventure * 2.0
            scored.append((c, float(score)))
        scored.sort(key=lambda t: t[1], reverse=True)
        return scored

artifacts = MLArtifacts.load_or_init()