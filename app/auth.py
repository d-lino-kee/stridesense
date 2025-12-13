import firebase_admin
from firebase_admin import credentials, auth as fb_auth
from fastapi import Depends, HTTPException, Header
from .config import settings

if not firebase_admin._apps and settings.FIREBASE_CREDENTIALS_JSON:
    cred = credentials.Certificate(settings.FIREBASE_CREDENTIALS_JSON)
    firebase_admin.initialize_app(cred)

async def get_current_user(authorization: str | None = Header(default=None)):
    """
    Return Firebase user_id (sub) if bearer token valid; else None.
    Allows public demo by returning None when no header is supplied.
    """
    if not authorization or not authorization.startswith("Bearer"):
        return None
    id_token = authorization.split(" ", 1)[1]
    try:
        decoded = fb_auth.verify_id_token(id_token)
        return decoded.get("uid")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid Firebase token")