import random
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from ..auth import get_current_user
from ..config import settings
from ..integrations import strava as strava_api
from ..database import session_scope
from ..models import Run, Route, User
from ..utils import season_from_date
from ..ml.trainer import train_soreness_model, train_suitability_model


router = APIRouter(prefix="/oauth", tags=["oauth"])


def _ensure_user(db: Session, user_id: str) -> None:
    if not db.get(User, user_id):
        db.add(User(user_id=user_id))


def _retrain_for(user_id: str) -> None:
    """Retrain both ML models on a user's runs after an import."""
    with session_scope() as db:
        runs = db.query(Run).filter(Run.user_id == user_id).all()
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
        route_rows = [
            {"distance_km": r.distance_km, "elevation_gain": r.elevation_gain}
            for r in db.query(Route).all()
        ]
    train_soreness_model(run_rows)
    train_suitability_model(run_rows, route_rows)


@router.get("/strava/start")
async def strava_start(user_id: str | None = Depends(get_current_user)):
    url = strava_api.oauth_start_url(state=user_id or "demo")
    return {"url": url}


@router.post("/strava/demo")
async def strava_demo_import(user_id: str | None = Depends(get_current_user)):
    """Simulate a Strava import.

    Injects a batch of realistic activities into the signed-in user's account and
    retrains the models — so the full import experience (activities appear, charts
    fill in, recommendations sharpen) can be tested without real Strava API access,
    which is gated behind a subscription. The genuine OAuth flow above is unchanged.
    """
    uid = user_id or "demo"
    rng = random.Random()
    today = datetime.utcnow()
    imported = 0

    with session_scope() as db:
        _ensure_user(db, uid)
        for i in range(15):
            dt = today - timedelta(days=i * 3 + rng.randint(0, 1), hours=rng.randint(0, 6))
            dist = round(rng.uniform(4.0, 16.0), 1)
            speed = round(rng.uniform(9.5, 13.5), 1)  # km/h
            elev = round(rng.uniform(20, 220))
            run_type = (
                "marathon" if dist > 15 else "mid" if dist > 8 else "light" if dist > 5 else "jog"
            )
            soreness = int(max(1, min(10, round(2 + dist / 6 + elev / 150 + rng.uniform(-1, 1)))))
            db.add(Run(
                user_id=uid,
                date=dt,
                day_of_week=dt.weekday(),
                season=season_from_date(dt),
                run_type=run_type,
                distance_km=dist,
                avg_speed=speed,
                avg_elevation=float(elev),
                soreness_level=soreness,
                rushed=rng.random() < 0.2,
            ))
            imported += 1

    _retrain_for(uid)
    return {"imported": imported, "source": "demo", "user_id": uid}


@router.get("/strava/callback")
async def strava_callback(code: str, state: str | None = None):
    token = strava_api.exchange_token(code)
    access_token = token.get("access_token") or ""
    activities = strava_api.get_activities(access_token, per_page=50)

    with session_scope() as db:
        user_id = state or "demo"
        _ensure_user(db, user_id)
        for a in activities:
            if a.get("type") != "Run":
                continue
            start_date = datetime.fromisoformat(a["start_date_local"].replace("Z", "+00:00"))
            dist_km = float(a.get("distance", 0.0)) / 1000.0
            speed_kmh = float(a.get("average_speed", 0.0)) * 3.6
            elev_gain = float(a.get("total_elevation_gain", 0.0))
            db.add(Run(
                user_id=user_id,
                date=start_date,
                day_of_week=start_date.weekday(),
                season=season_from_date(start_date),
                run_type="mid" if dist_km > 8 else "light" if dist_km > 5 else "jog",
                distance_km=dist_km,
                avg_speed=speed_kmh,
                avg_elevation=elev_gain,
                soreness_level=3,
                rushed=False,
            ))

    return RedirectResponse(url=f"{settings.FRONTEND_ORIGIN}/dashboard")
