from fastapi import APIRouter, Depends
from ..auth import get_current_user
from ..database import session_scope
from ..models import Run, Route, User
from ..schemas import RecommendationInput
from ..ml.model import artifacts
from ..ml.trainer import user_stats_from_runs


router = APIRouter(prefix="/recommend", tags=["recommend"])


_FALLBACK_ROUTES = [
    {"route_id": 1, "name": "Lake Loop", "distance_km": 8.2, "elevation_gain": 120},
    {"route_id": 2, "name": "Valley Glide", "distance_km": 7.3, "elevation_gain": 40},
    {"route_id": 3, "name": "Summit Sprint", "distance_km": 10.5, "elevation_gain": 240},
    {"route_id": 4, "name": "Riverside Out & Back", "distance_km": 6.8, "elevation_gain": 60},
]


@router.post("")
async def recommend(payload: RecommendationInput, user_id: str | None = Depends(get_current_user)):
    with session_scope() as db:
        runs = db.query(Run).filter(Run.user_id == user_id).all() if user_id else []
        routes = db.query(Route).filter(Route.user_id == user_id).all() if user_id else []
        user = db.get(User, user_id) if user_id else None
        user_fitness = float(user.fitness_level) if user else 5.0
        user_pref = (user.pref_elevation if user else None) or payload.pref_elevation

    candidates = (
        [
            {
                "route_id": r.route_id,
                "name": r.name,
                "distance_km": r.distance_km,
                "elevation_gain": r.elevation_gain,
            }
            for r in routes
        ]
        or _FALLBACK_ROUTES
    )

    run_rows = [
        {
            "distance_km": r.distance_km,
            "avg_speed": r.avg_speed,
            "avg_elevation": r.avg_elevation,
            "rushed": r.rushed,
            "run_type": r.run_type,
            "day_of_week": r.day_of_week,
            "soreness_level": r.soreness_level,
        }
        for r in runs
    ]
    user_stats = user_stats_from_runs(run_rows)
    user_stats["fitness_level"] = user_fitness

    context = payload.model_dump()
    context["pref_elevation"] = user_pref

    ranked = artifacts.rank_candidates(context, candidates, user_stats)
    top, score = ranked[0]

    recent_like = [{
        "distance_km": top["distance_km"],
        "avg_speed": 60.0 / user_stats["avg_pace_min_per_km"],
        "avg_elevation": top["elevation_gain"],
        "rushed": payload.rushed,
        "run_type": payload.feeling,
        "day_of_week": payload.day_of_week,
        "soreness_level": 3,
    }]
    soreness = artifacts.predict_soreness(recent_like)

    rationale = (
        f"Picked '{top['name']}' for a {payload.feeling} day. "
        f"Avg pace {user_stats['avg_pace_min_per_km']:.1f} min/km, "
        f"distance {top['distance_km']:.1f} km, elevation +{int(top['elevation_gain'])} m. "
        f"Suitability {score:.1f}/10, predicted soreness {soreness}/10."
    )

    return {
        "route": {**top, "type": payload.feeling},
        "predicted_soreness": soreness,
        "suitability_score": score,
        "rationale": rationale,
    }
