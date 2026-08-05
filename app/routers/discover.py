"""Route discovery: generate candidate routes and rank the top 10 with the ML model."""

from __future__ import annotations

import random

from fastapi import APIRouter, Depends

from ..auth import get_current_user
from ..database import session_scope
from ..models import Run, User
from ..ml.model import artifacts
from ..ml.trainer import user_stats_from_runs
from ..route_intel.discover import generate_candidates
from ..route_intel import places
from ..schemas import DiscoverInput

router = APIRouter(prefix="/discover", tags=["discover"])

_TARGET_BY_FEELING = {"jog": 4.0, "light": 6.5, "mid": 9.0, "marathon": 18.0}
_ACCENTS = [
    "#f96316", "#2563eb", "#10b981", "#8b5cf6", "#f43f5e",
    "#0ea5e9", "#14b8a6", "#f59e0b", "#ec4899", "#6366f1",
]
_FLAT_ADJ = ["Riverside", "Parkside", "Lakeside", "City", "Meadow", "Harbour"]
_HILL_ADJ = ["Hillcrest", "Ridge", "Summit", "Highland", "Skyline", "Vista"]
_SHAPE_LABEL = {"loop": "Loop", "out-and-back": "Out & Back", "point-to-point": "Route"}


def _difficulty(dist: float, gain: float) -> str:
    grade = gain / max(dist, 0.1)  # metres gained per km
    if dist >= 16 or gain >= 260:
        return "Epic"
    if grade >= 22 or gain >= 150:
        return "Hard"
    if grade >= 10 or dist >= 9:
        return "Moderate"
    return "Easy"


def _surface(seed: int, adventure: float) -> str:
    rng = random.Random(seed)
    if adventure > 0.6 and rng.random() < 0.6:
        return rng.choice(["Gravel trail", "Mixed trail"])
    return rng.choice(["Paved path", "Mixed path", "Rail trail"])


def _name(seed: int, area: str | None, shape: str, gain_per_km: float, dist: float) -> str:
    rng = random.Random(seed)
    adj = rng.choice(_HILL_ADJ if gain_per_km >= 14 else _FLAT_ADJ)
    label = _SHAPE_LABEL.get(shape, "Route")
    prefix = f"{area.split(',')[0]} " if area else ""
    return f"{prefix}{adj} {dist:.1f}k {label}"


def _match(dist: float, gain: float, target: float, pref: str | None) -> float:
    """A granular 0-10 fit score used to spread out otherwise-saturated ML scores."""
    m = 10.0
    m -= abs(dist - target) * 0.75
    gpk = gain / max(dist, 0.1)
    if pref == "up":
        m += min(1.5, gpk / 14)
    elif pref == "down":
        m -= max(0.0, gpk - 8) / 12
    else:  # flat / None
        m -= max(0.0, gpk - 12) / 12
    return max(0.0, min(10.0, m))


def _blurb(dist: float, gain: float, surface: str, shape: str) -> str:
    if gain / max(dist, 0.1) < 10:
        terrain = "stays mostly flat, so you can hold a smooth, even pace"
    elif gain / max(dist, 0.1) < 22:
        terrain = "rolls gently with a few honest rises to keep it interesting"
    else:
        terrain = "climbs and drops with real hills to test the legs"
    shape_txt = {
        "loop": "It comes back to where you started",
        "out-and-back": "You head out and retrace your steps home",
        "point-to-point": "It carries you from your start toward your finish",
    }.get(shape, "It flows naturally from start to finish")
    return f"A {dist:.1f} km run on {surface.lower()} that {terrain}. {shape_txt}."


@router.post("")
def discover(payload: DiscoverInput, user_id: str | None = Depends(get_current_user)):
    # Sync def → FastAPI runs it in a worker thread, so the blocking reverse-geocode
    # calls used to name routes don't stall the event loop.
    # Personalise from the signed-in user's history where available.
    with session_scope() as db:
        runs = db.query(Run).filter(Run.user_id == user_id).all() if user_id else []
        user = db.get(User, user_id) if user_id else None
        user_fitness = float(user.fitness_level) if user else 5.0

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
    pace = user_stats["avg_pace_min_per_km"]

    # Resolve a target distance.
    if payload.target_distance_km:
        target = float(payload.target_distance_km)
    elif payload.time_available_min:
        target = max(1.5, payload.time_available_min / max(pace, 3.0))
    else:
        target = _TARGET_BY_FEELING.get(payload.feeling, 8.0)

    start = (payload.start_lat, payload.start_lng)
    end = (
        (payload.end_lat, payload.end_lng)
        if payload.end_lat is not None and payload.end_lng is not None
        else None
    )

    candidates = generate_candidates(start, end, target, payload.adventure_level, count=90)

    context = {
        "feeling": payload.feeling,
        "pref_elevation": payload.pref_elevation,
        "adventure_level": payload.adventure_level,
        "rushed": payload.rushed,
        "day_of_week": payload.day_of_week,
        "target_distance_km": target,
    }
    scored = artifacts.rank_candidates(context, candidates, user_stats)
    # Blend the ML suitability with a granular fit score so results spread out
    # instead of all saturating at 10, then take the best 50.
    blended = [
        (c, 0.55 * ml + 0.45 * _match(c["distance_km"], c["elevation_gain"], target, payload.pref_elevation))
        for c, ml in scored
    ]
    blended.sort(key=lambda t: t[1], reverse=True)
    ranked = blended[:50]

    # Name each route after the neighborhood/place near its midpoint.
    midpoints = [
        (c["waypoints"][len(c["waypoints"]) // 2]["lat"], c["waypoints"][len(c["waypoints"]) // 2]["lng"])
        for c, _ in ranked
    ]
    place_lookup = places.names_for_points(midpoints)

    items = []
    for i, (c, score) in enumerate(ranked):
        dist = c["distance_km"]
        gain = c["elevation_gain"]
        gain_per_km = gain / max(dist, 0.1)
        surface = _surface(c["seed"], payload.adventure_level)

        mid = c["waypoints"][len(c["waypoints"]) // 2]
        place = places.name_for(mid["lat"], mid["lng"], place_lookup)
        shape_label = _SHAPE_LABEL.get(c["shape"], "Route")
        name = (
            f"{place} · {dist:.1f}k {shape_label}"
            if place
            else _name(c["seed"], payload.area, c["shape"], gain_per_km, dist)
        )

        # Predicted soreness for this specific route.
        recent_like = [{
            "distance_km": dist,
            "avg_speed": 60.0 / max(pace, 0.1),
            "avg_elevation": gain,
            "rushed": payload.rushed,
            "run_type": payload.feeling,
            "day_of_week": payload.day_of_week,
            "soreness_level": 3,
        }]
        soreness = artifacts.predict_soreness(recent_like)

        items.append({
            "id": i + 1,
            "slug": f"discover-{c['seed']}",
            "name": name,
            "area": (place or (payload.area.split(",")[0] if payload.area else "Near you")),
            "blurb": _blurb(dist, gain, surface, c["shape"]),
            "distanceKm": dist,
            "elevationM": round(gain),
            "minutes": max(1, round(dist * pace)),
            "score": round(float(score), 1),
            "soreness": round(float(soreness)),
            "difficulty": _difficulty(dist, gain),
            "tag": _SHAPE_LABEL.get(c["shape"], "Route"),
            "surface": surface,
            "accent": _ACCENTS[i % len(_ACCENTS)],
            "waypoints": c["waypoints"],
            "elevation": c["elevation"],
        })

    return {
        "items": items,
        "target_km": round(target, 1),
        "count": len(items),
        "personalized": bool(user_id and run_rows),
    }
