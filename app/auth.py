import base64
import json

import firebase_admin
from firebase_admin import credentials, auth as fb_auth
from fastapi import HTTPException, Header
from .config import settings

if not firebase_admin._apps and settings.FIREBASE_CREDENTIALS_JSON:
    cred = credentials.Certificate(settings.FIREBASE_CREDENTIALS_JSON)
    firebase_admin.initialize_app(cred)

_HAS_ADMIN = bool(firebase_admin._apps)


def _decode_unverified(id_token: str) -> str | None:
    """Extract the uid from a Firebase JWT WITHOUT verifying its signature.

    This is a local-development convenience so a signed-in user can log runs
    without configuring a Firebase Admin service account. It trusts the token's
    claims blindly and MUST NOT be relied on in production — set
    FIREBASE_CREDENTIALS_JSON there to enable real verification above.
    """
    try:
        payload_b64 = id_token.split(".")[1]
        payload_b64 += "=" * (-len(payload_b64) % 4)  # pad base64
        data = json.loads(base64.urlsafe_b64decode(payload_b64))
        return data.get("user_id") or data.get("sub")
    except Exception:
        return None


async def get_current_user(authorization: str | None = Header(default=None)):
    """
    Return the Firebase user id if a bearer token is supplied; else None.
    Allows public demo mode by returning None when no header is present.
    """
    if not authorization or not authorization.startswith("Bearer "):
        return None
    id_token = authorization.split(" ", 1)[1]

    if _HAS_ADMIN:
        try:
            decoded = fb_auth.verify_id_token(id_token)
            return decoded.get("uid")
        except Exception:
            raise HTTPException(status_code=401, detail="Invalid Firebase token")

    # No service account configured → local-dev fallback (unverified decode).
    return _decode_unverified(id_token)
