from __future__ import annotations
import os
from dataclasses import dataclass
import joblib
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from .featurizer import build_features_for_soreness, build_features_for_suitability


MODELS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "models"))
os.makedirs(MODELS_DIR, exist_ok=True)

SORENESS_PATH = os.path.join(MODELS_DIR, "soreness.pkl")
SUITABILITY_PATH = os.path.join(MODELS_DIR, "suitability.pkl")


@dataclass
class MLArtifacts:
    soreness: RandomForestRegressor
    suitability: RandomForestRegressor

    def save(self) -> None:
        joblib.dump(self.soreness, SORENESS_PATH)
        joblib.dump(self.suitability, SUITABILITY_PATH)

    @staticmethod
    def load_or_init() -> "MLArtifacts":
        soreness = (
            joblib.load(SORENESS_PATH)
            if os.path.exists(SORENESS_PATH)
            else RandomForestRegressor(n_estimators=120, random_state=42)
        )
        suitability = (
            joblib.load(SUITABILITY_PATH)
            if os.path.exists(SUITABILITY_PATH)
            else RandomForestRegressor(n_estimators=160, random_state=42)
        )
        return MLArtifacts(soreness=soreness, suitability=suitability)

    def predict_soreness(self, runs_like: list[dict]) -> float:
        X, _ = build_features_for_soreness(runs_like)
        if getattr(self.soreness, "n_features_in_", None) is None or X.shape[0] == 0:
            baseline = (
                float(np.mean([r.get("soreness_level", 3) for r in runs_like]))
                if runs_like
                else 3.0
            )
            return float(round(baseline, 2))
        pred = float(self.soreness.predict([X[-1]])[0])
        return max(1.0, min(10.0, round(pred, 2)))

    def score_candidate(self, context: dict, candidate: dict, user_stats: dict) -> float:
        x = build_features_for_suitability(context, candidate, user_stats)
        if getattr(self.suitability, "n_features_in_", None) is None:
            from .featurizer import synthesize_suitability_label
            return synthesize_suitability_label(x)
        pred = float(self.suitability.predict([x])[0])
        return float(max(0.0, min(10.0, round(pred, 2))))

    def rank_candidates(
        self,
        context: dict,
        candidates: list[dict],
        user_stats: dict,
    ) -> list[tuple[dict, float]]:
        scored = [(c, self.score_candidate(context, c, user_stats)) for c in candidates]
        scored.sort(key=lambda t: t[1], reverse=True)
        return scored


artifacts = MLArtifacts.load_or_init()
