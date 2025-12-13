from __future__ import annotations
from .model import artifacts
from .featurizer import build_features_for_soreness
from sklearn.ensemble import RandomForestRegressor
import numpy as np

def train_soreness_model(run_rows: list[dict]):
    if not run_rows:
        return
    X, y = build_features_for_soreness(run_rows)
    model = RandomForestRegressor(n_estimators=180, random_state=42)
    model.fit(X, y)
    artifacts.soreness = model
    artifacts.save()