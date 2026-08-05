"""Geocoding proxy.

Wraps Komoot's Photon geocoder (OSM-based) so the frontend can search cities and
start/end locations without an API key. Photon is built for type-ahead search and
tolerates frequent queries, so it doesn't rate-limit us the way public Nominatim
does. Proxying server-side lets us cache results and avoid browser CORS issues.
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException

from ..distributed import cache
from .. import http_util

router = APIRouter(prefix="/geo", tags=["geo"])

_PHOTON = "https://photon.komoot.io/api"
_HEADERS = {"User-Agent": "StrideSense/1.0 (running route planner; local dev)"}
_TTL = 60 * 60 * 24  # geocodes are stable; cache for a day


def _display(props: dict) -> str:
    name = props.get("name") or ""
    parts = [name]
    for field in ("city", "county", "state", "country"):
        v = props.get(field)
        if v and v != name and v not in parts:
            parts.append(v)
    return ", ".join(p for p in parts if p)


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
            _PHOTON,
            params={"q": q, "limit": limit, "lang": "en"},
            headers=_HEADERS,
            timeout=10,
        )
        r.raise_for_status()
        feats = r.json().get("features", [])
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Geocoder unavailable: {e}")

    items = []
    for f in feats:
        props = f.get("properties", {})
        coords = f.get("geometry", {}).get("coordinates", [])
        if len(coords) < 2:
            continue
        label = props.get("name") or props.get("city") or _display(props).split(",")[0]
        items.append(
            {
                "label": label,
                "display_name": _display(props),
                "lat": float(coords[1]),
                "lng": float(coords[0]),
                "type": props.get("osm_value") or props.get("type"),
            }
        )

    cache.set_json(cache_key, items, ttl=_TTL)
    return {"items": items, "cached": False}
