from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
from ..auth import get_current_user
from ..integrations import strava as strava_api
from ..database import session_scope
from ..models import Run, User
from ..utils import season_from_date
from datetime import datetime

router = APIRouter(prefix="/oauth", tags=["oauth"])

@router.get("/strava/start")
async def strava_start(user_id: str | None = Depends(get_current_user)):
    # Ideally bind state to user session; here we pass-through 'state'
    url = strava_api.oauth_start_url(state = user_id or "demo")
    return {"url": url}

@router.get("/strava/callback")
async def strava_callback(code: str, state: str | None = None):
    token = strava_api.exchange_token(code)
    access_token = token.get("access_token")
    activities = strava_api.get_activities(access_token, per_page = 50)

    # Persist a subset of activities to the signed-in user (state)
    with session_scope() as db:
        user_id = state or "demo"
        ensure_user(db, user_id)
        for a in activities:
            if a.get("type") != "Run":
                continue
            start_date = datetime.fromisoformat(a["start_date_local"].replace("Z", "+00:00"))
            dist_km = float(a.get("distance", 0.0)) / 1000.00
            speed_kmh = float(a.get("average_speed", 0.0)) * 3.6
            elev_gain = float(a.get("total_elevation_gain", 0.0))
            r = Run(
                user_id = user_id,
                date = start_date,
                day_of_week = start_date.weekday(),
                season = season_from_date(start_date),
                run_type = "mid" if dist_km > 8 else "light" if dist_km > 5 else "jog",
                distance_km = dist_km,
                avg_speed = speed_kmh,
                avg_elevation = elev_gain,
                soreness_level = 3,
                rushed = False
            )
            db.add(r)
    # Redirect to frontend dashboard after import
    return RedirectResponse(url="/")
    
def ensure_user(db, user_id: str):
    u = db.query(User).get(user_id)
    if not u:
        db.add(User(user_id = user_id))