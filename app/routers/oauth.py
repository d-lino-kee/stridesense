from datetime import datetime
from fastapi import APIRouter, Depends
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from ..auth import get_current_user
from ..config import settings
from ..integrations import strava as strava_api
from ..database import session_scope
from ..models import Run, User
from ..utils import season_from_date


router = APIRouter(prefix="/oauth", tags=["oauth"])


def _ensure_user(db: Session, user_id: str) -> None:
    if not db.get(User, user_id):
        db.add(User(user_id=user_id))


@router.get("/strava/start")
async def strava_start(user_id: str | None = Depends(get_current_user)):
    url = strava_api.oauth_start_url(state=user_id or "demo")
    return {"url": url}


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
