"""Geocoding proxy.

Wraps OpenStreetMap's free Nominatim geocoder so the frontend can search cities
and start/end locations without an API key. Proxying server-side lets us set a
proper User-Agent, keep within usage limits via the distributed cache, and avoid
browser CORS issues.
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException

from ..distributed import cache
from .. import http_util

router = APIRouter(prefix="/geo", tags=["geo"])

_NOMINATIM = "https://nominatim.openstreetmap.org/search"
_HEADERS = {"User-Agent": "StrideSense/1.0 (running route planner; local dev)"}
_TTL = 60 * 60 * 24  # geocodes are stable; cache for a day


@router.get("/search")
async def search(q: str, limit: int = 6):
    q = (q or "").strip()
    if len(q) < 2:
        return {"items": []}

    cache_key = f"geo:{q.lower()}:{limit}"
    cached = cache.get_json(cache_key)
    if cached is not None:
        return {"items": cached, "cached": True}

    try:
        r = http_util.get(
            _NOMINATIM,
            params={"q": q, "format": "json", "limit": limit, "addressdetails": 1},
            headers=_HEADERS,
            timeout=10,
        )
        r.raise_for_status()
        data = r.json()
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Geocoder unavailable: {e}")

    items = []
    for d in data:
        addr = d.get("address", {})
        label = (
            addr.get("city")
            or addr.get("town")
            or addr.get("village")
            or addr.get("suburb")
            or d.get("name")
            or d.get("display_name", "").split(",")[0]
        )
        items.append(
            {
                "label": label,
                "display_name": d.get("display_name", ""),
                "lat": float(d["lat"]),
                "lng": float(d["lon"]),
                "type": d.get("type"),
            }
        )

    cache.set_json(cache_key, items, ttl=_TTL)
    return {"items": items, "cached": False}
