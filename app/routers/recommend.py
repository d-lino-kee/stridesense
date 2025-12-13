from fastapi import APIRouter, Depends
from ..auth import get_current_user
from ..database import session_scope
from ..models import Run, Route
from ..schemas import RecommendationInput
from ..ml.model import artifacts

router = APIRouter(prefix="/recommend", tags=["recommends"])

@router.post("")
async def recommend(payload: RecommendationInput, user_id: str | None = Depends(get_current_user)):
    # Fetch user data
    with session_scope() as db:
        runs = db.query(Run).filter(Run.user_id == user_id).all() if user_id else []
        routes = db.query(Route).filter(Route.user_id == user_id).all() if user_id else []

    # Fallback demo candidates
    if not routes:
        routes = [
            Route(route_id=1, user_id=user_id or "demo", name="Lake Loop", distance_km=8.2, elevation_gain=120, map_data=None),
            Route(route_id=2, user_id=user_id or "demo", name="Valley Glide", distance_km=7.3, elevation_gain=40, map_data=None),
            Route(route_id=3, user_id=user_id or "demo", name="Summit Sprint", distance_km=10.5, elevation_gain=240, map_data=None),
            Route(route_id=4, user_id=user_id or "demo", name="Riverside Out & Back", distance_km=6.8, elevation_gain=60, map_data=None),
        ]

    # Compute user stats
    if runs:
        avg_pace = sum([r.distance_km / max(r.avg_speed, 0.1) for r in runs])
        avg_pace_min_per_km = avg_pace * 60
        avg_elev = sum([r.avg_elevation for r in runs]) / len(runs)
    else:
        avg_pace_min_per_km = 5.5
        avg_elev = 90

    user_stats = {"avg_pace_min_per_km": avg_pace_min_per_km, "avg_elev_gain": avg_elev}

    # Rank candidates
    candidates = [
        {"route_id": r.route_id, "name": r.name, "distance_km": r.distance_km, "elevation_gain": r.elevation_gain}
        for r in routes
    ]
    ranked = artifacts.rank_candidates(payload.model_dump(), candidates, user_stats)
    top, score = ranked[0]

    # Predict soreness for this context (simulate latest-run-like record)
    recent_like = [{
        "distance_km": top["distance_km"],
        "avg_speed": 60.0 / user_stats["avg_pace_min_per_km"]
        "avg_elevation": top["elevation_gain"],
        "rushed": payload.rushed,
        "run_type": payload.feeling,
        "day_of_week": payload.day_of_week,
        "soreness_level": 3,
    }]
    soreness = artifacts.predict_soreness(recent_like)

    rationale = (
        f"Selected '{top['name']}' for a {payload.feeling} given your average pace."
        f"{user_stats['avg_pace_min_per_km']:.1f} min/km, distance alignment and elevation {int(top['elevation_gain'])} m."
    )

    return {
        "route": {**top, "type": payload.feeling},
        "predicted_soreness": soreness,
        "rationale": rationale,
    }