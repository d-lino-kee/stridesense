import requests
from ..config import settings


MAPS_DIRECTIONS = "https://maps.googleapis.com/maps/api/directions/json"
MAPS_ELEVATION = "https://maps.googleapis.com/maps/api/elevation/json"


def directions(origin: str, destination: str, mode: str = "walking") -> dict:
    if not settings.GOOGLE_MAPS_API_KEY:
        raise ValueError("Missing GOOGLE_MAPS_API_KEY")
    params = {
        "origin": origin,
        "destination": destination,
        "mode": mode,
        "key": settings.GOOGLE_MAPS_API_KEY,
    }
    r = requests.get(MAPS_DIRECTIONS, params=params, timeout=10)
    r.raise_for_status()
    return r.json()


def elevation_along_path(encoded_polyline: str, samples: int = 256) -> dict:
    if not settings.GOOGLE_MAPS_API_KEY:
        raise ValueError("Missing GOOGLE_MAPS_API_KEY")
    params = {
        "path": f"enc:{encoded_polyline}",
        "samples": samples,
        "key": settings.GOOGLE_MAPS_API_KEY,
    }
    r = requests.get(MAPS_ELEVATION, params=params, timeout=10)
    r.raise_for_status()
    return r.json()
