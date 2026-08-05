"""Reverse-geocoding to name routes after the neighborhood/place they pass through.

Uses Komoot's Photon geocoder (OSM-based), which is built for frequent queries and
tolerates the small bursts we need. Results are kept in a persistent JSON cache
(rounded to ~1 km so nearby routes share a lookup), so once a neighborhood is
resolved it survives restarts and is reused instantly. Everything is best-effort:
failures are never cached, and callers fall back to generic names when nothing
resolves.
"""

from __future__ import annotations

import concurrent.futures
import json
import os
import threading

from .. import http_util

_REVERSE = "https://photon.komoot.io/reverse"
_HEADERS = {"User-Agent": "StrideSense/1.0 (running route planner; local dev)"}

_CACHE_FILE = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".geo_cache.json"))
_lock = threading.Lock()

# Photon property fields, most neighborhood-like first.
_PREFERRED = (
    "district",
    "locality",
    "suburb",
    "neighbourhood",
    "quarter",
    "name",
    "street",
    "city",
    "town",
    "village",
)


def _load() -> dict:
    try:
        with open(_CACHE_FILE, encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}


_cache: dict[str, str] = _load()


def _save() -> None:
    try:
        with _lock:
            with open(_CACHE_FILE, "w", encoding="utf-8") as f:
                json.dump(_cache, f)
    except Exception:
        pass


def _key(lat: float, lng: float) -> str:
    # ~1 km grid so nearby points reuse the same cached neighborhood.
    return f"{round(lat, 2)}:{round(lng, 2)}"


def _reverse_one(lat: float, lng: float) -> str | None:
    ck = _key(lat, lng)
    if ck in _cache:
        return _cache[ck] or None  # "" means resolved-but-unnamed

    try:
        r = http_util.get(
            _REVERSE,
            params={"lat": lat, "lon": lng, "lang": "en"},
            headers=_HEADERS,
            timeout=6,
        )
        if r.status_code != 200:
            return None  # throttled/error → don't cache, retry next time
        feats = r.json().get("features", [])
        props = feats[0].get("properties", {}) if feats else {}
    except Exception:
        return None  # network/SSL error → don't cache

    name = ""
    for field in _PREFERRED:
        if props.get(field):
            name = props[field]
            break
    _cache[ck] = name  # cache only genuine responses (success or truly unnamed)
    return name or None


def names_for_points(points: list[tuple[float, float]]) -> dict[tuple[float, float], str | None]:
    """Reverse-geocode a batch of points, returning {rounded (lat,lng): place name}."""
    uniq: dict[tuple[float, float], tuple[float, float]] = {}
    for lat, lng in points:
        uniq[(round(lat, 2), round(lng, 2))] = (lat, lng)

    out: dict[tuple[float, float], str | None] = {}
    if not uniq:
        return out

    # Split into cache hits (instant) and misses (need a network call).
    misses = {k: v for k, v in uniq.items() if _key(v[0], v[1]) not in _cache}
    for k, v in uniq.items():
        if k not in misses:
            out[k] = _cache.get(_key(v[0], v[1])) or None

    if misses:
        try:
            with concurrent.futures.ThreadPoolExecutor(max_workers=5) as ex:
                futures = {ex.submit(_reverse_one, lat, lng): k for k, (lat, lng) in misses.items()}
                for fut in concurrent.futures.as_completed(futures, timeout=10):
                    k = futures[fut]
                    try:
                        out[k] = fut.result()
                    except Exception:
                        out[k] = None
        except Exception:
            pass
        _save()

    return out


def name_for(lat: float, lng: float, lookup: dict[tuple[float, float], str | None]) -> str | None:
    return lookup.get((round(lat, 2), round(lng, 2)))
