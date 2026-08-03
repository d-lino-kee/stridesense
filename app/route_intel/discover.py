"""Procedural running-route generator.

Given a start point (and optionally an end point) plus a target distance, this
synthesizes a diverse set of candidate routes — loops, out-and-backs and
point-to-point paths — as ordered lat/lng waypoints with a plausible elevation
profile. The candidates are then scored/ranked by the sklearn suitability model
in the /discover router, so the "top 10" reflects the user's ML parameters.

Geometry is approximate; the frontend's Google Maps directions embed snaps a
real walking path through the waypoints, so the drawn routes follow real streets.
"""

from __future__ import annotations

import math
import random

EARTH_KM = 6371.0


def haversine(a: tuple[float, float], b: tuple[float, float]) -> float:
    lat1, lng1 = map(math.radians, a)
    lat2, lng2 = map(math.radians, b)
    dlat, dlng = lat2 - lat1, lng2 - lng1
    h = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlng / 2) ** 2
    return 2 * EARTH_KM * math.asin(math.sqrt(h))


def dest_point(lat: float, lng: float, bearing_deg: float, dist_km: float) -> tuple[float, float]:
    br = math.radians(bearing_deg)
    lat1, lng1 = math.radians(lat), math.radians(lng)
    dr = dist_km / EARTH_KM
    lat2 = math.asin(math.sin(lat1) * math.cos(dr) + math.cos(lat1) * math.sin(dr) * math.cos(br))
    lng2 = lng1 + math.atan2(
        math.sin(br) * math.sin(dr) * math.cos(lat1),
        math.cos(dr) - math.sin(lat1) * math.sin(lat2),
    )
    return math.degrees(lat2), math.degrees(lng2)


def bearing(a: tuple[float, float], b: tuple[float, float]) -> float:
    lat1, lng1 = math.radians(a[0]), math.radians(a[1])
    lat2, lng2 = math.radians(b[0]), math.radians(b[1])
    dl = lng2 - lng1
    y = math.sin(dl) * math.cos(lat2)
    x = math.cos(lat1) * math.sin(lat2) - math.sin(lat1) * math.cos(lat2) * math.cos(dl)
    return (math.degrees(math.atan2(y, x)) + 360) % 360


def _path_len(pts: list[tuple[float, float]]) -> float:
    return sum(haversine(pts[i], pts[i + 1]) for i in range(len(pts) - 1))


def _elevation(seed: int, n: int, hilliness: float, base: float) -> list[float]:
    rng = random.Random(seed)
    phase = rng.uniform(0, math.tau)
    out = []
    for i in range(n):
        t = i / (n - 1)
        h = math.sin(t * math.pi + phase) * hilliness
        h += math.sin(t * math.pi * 3 + phase * 1.7) * hilliness * 0.35
        h += rng.uniform(-1, 1) * hilliness * 0.12
        out.append(round(base + h, 1))
    return out


def _elev_gain(profile: list[float]) -> float:
    return round(sum(max(0.0, profile[i] - profile[i - 1]) for i in range(1, len(profile))), 1)


def _loop(start: tuple[float, float], radius_km: float, bearing0: float, squash: float) -> list[tuple[float, float]]:
    """A closed loop that begins and ends at `start`."""
    # Centre offset so the loop passes through the start point.
    cx, cy = dest_point(start[0], start[1], bearing0, radius_km)
    pts = [start]
    for k in range(1, 8):
        ang = bearing0 + 180 + k * (360 / 8)
        r = radius_km * (squash if (k % 2 == 0) else 1.0)
        pts.append(dest_point(cx, cy, ang, r))
    pts.append(start)
    return pts


def _out_and_back(start: tuple[float, float], bearing0: float, leg_km: float, wobble: float) -> list[tuple[float, float]]:
    mid = dest_point(start[0], start[1], bearing0 + wobble, leg_km * 0.5)
    turn = dest_point(start[0], start[1], bearing0, leg_km)
    return [start, mid, turn, mid, start]


def _point_to_point(
    start: tuple[float, float], end: tuple[float, float], amp_km: float, segments: int, side: int
) -> list[tuple[float, float]]:
    brg = bearing(start, end)
    base = haversine(start, end)
    pts = [start]
    for i in range(1, segments):
        f = i / segments
        # point along the straight line
        on_line = dest_point(start[0], start[1], brg, base * f)
        # offset perpendicular in a smooth arc
        offset = amp_km * math.sin(math.pi * f) * side
        p = dest_point(on_line[0], on_line[1], brg + 90, offset)
        pts.append(p)
    pts.append(end)
    return pts


def generate_candidates(
    start: tuple[float, float],
    end: tuple[float, float] | None,
    target_km: float,
    adventure: float = 0.4,
    count: int = 28,
) -> list[dict]:
    """Return `count` diverse candidate routes near `target_km`."""
    rng = random.Random(hash((round(start[0], 4), round(start[1], 4), end, round(target_km, 1))) & 0xFFFFFFFF)
    base_elev = 180 + rng.uniform(0, 220)
    cands: list[dict] = []

    for i in range(count):
        seed = rng.randint(0, 1_000_000)
        local = random.Random(seed)
        # Vary target a little per candidate for spread.
        t = target_km * local.uniform(0.72, 1.28)
        hilliness = local.uniform(4, 12 + adventure * 70)

        if end is not None:
            straight = max(0.4, haversine(start, end))
            shape = "point-to-point" if i % 3 else "out-and-back"
            if shape == "out-and-back":
                brg = bearing(start, end) + local.uniform(-25, 25)
                pts = _out_and_back(start, brg, t, local.uniform(-18, 18))
            else:
                # amplitude chosen to stretch the straight line toward target
                extra = max(0.0, t - straight)
                amp = min(straight * 0.9, extra * local.uniform(0.5, 1.1) + 0.2)
                pts = _point_to_point(start, end, amp, local.randint(4, 6), 1 if i % 2 else -1)
        else:
            roll = i % 3
            if roll == 0:
                shape = "loop"
                pts = _loop(start, t / (2 * math.pi), local.uniform(0, 360), local.uniform(0.6, 1.0))
            elif roll == 1:
                shape = "out-and-back"
                pts = _out_and_back(start, local.uniform(0, 360), t / 2, local.uniform(-20, 20))
            else:
                shape = "loop"
                pts = _loop(start, t / (2 * math.pi), local.uniform(0, 360), local.uniform(0.75, 1.0))

        dist = round(_path_len(pts), 2)
        if dist < 0.8:
            continue
        profile = _elevation(seed, 12, hilliness, base_elev)
        cands.append(
            {
                "seed": seed,
                "shape": shape,
                "distance_km": dist,
                "elevation_gain": _elev_gain(profile),
                "elevation": profile,
                "waypoints": [{"lat": round(p[0], 6), "lng": round(p[1], 6)} for p in pts],
            }
        )

    return cands
