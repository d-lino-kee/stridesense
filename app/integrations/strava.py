import urllib.parse
import requests
from fastapi import HTTPException
from ..config import settings


STRAVA_AUTH_URL = "https://www.strava.com/oauth/authorize"
STRAVA_TOKEN_URL = "https://www.strava.com/oauth/token"
STRAVA_API_BASE = "https://www.strava.com/api/v3"


def oauth_start_url(state: str) -> str:
    if not settings.STRAVA_CLIENT_ID:
        raise HTTPException(status_code=500, detail="Missing STRAVA_CLIENT_ID")
    params = {
        "client_id": settings.STRAVA_CLIENT_ID,
        "response_type": "code",
        "redirect_uri": settings.APP_BASE_URL + settings.STRAVA_REDIRECT_PATH,
        "approval_prompt": "auto",
        "scope": "read,activity:read,activity:read_all",
        "state": state,
    }
    return f"{STRAVA_AUTH_URL}?{urllib.parse.urlencode(params)}"


def exchange_token(code: str) -> dict:
    if not (settings.STRAVA_CLIENT_ID and settings.STRAVA_CLIENT_SECRET):
        raise HTTPException(status_code=500, detail="Missing Strava credentials")
    r = requests.post(
        STRAVA_TOKEN_URL,
        data={
            "client_id": settings.STRAVA_CLIENT_ID,
            "client_secret": settings.STRAVA_CLIENT_SECRET,
            "code": code,
            "grant_type": "authorization_code",
        },
        timeout=10,
    )
    if r.status_code != 200:
        raise HTTPException(status_code=400, detail=f"Strava token error: {r.text}")
    return r.json()


def get_activities(access_token: str, per_page: int = 50) -> list[dict]:
    headers = {"Authorization": f"Bearer {access_token}"}
    r = requests.get(
        f"{STRAVA_API_BASE}/athlete/activities",
        params={"per_page": per_page},
        headers=headers,
        timeout=10,
    )
    if r.status_code != 200:
        raise HTTPException(status_code=400, detail=f"Strava activities error: {r.text}")
    return r.json()
