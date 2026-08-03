"""Generate an evocative, sensation-focused summary of a route.

Uses OpenAI when ``OPENAI_API_KEY`` is set, and otherwise falls back to a
deterministic template that reasons about distance, elevation profile, surface
and grade — so the feature works with zero external dependencies. This function
runs inside a task-queue worker, not in the request path.
"""

from __future__ import annotations

from ..config import settings


def _relief(elevation: list[float]) -> dict:
    if not elevation:
        return {"min": 0, "max": 0, "gain": 0, "relief": 0, "max_grade": 0}
    lo, hi = min(elevation), max(elevation)
    gain = sum(max(0.0, elevation[i] - elevation[i - 1]) for i in range(1, len(elevation)))
    return {"min": lo, "max": hi, "gain": round(gain), "relief": round(hi - lo)}


def _heuristic(payload: dict) -> str:
    name = payload.get("name", "This route")
    dist = float(payload.get("distance_km", 0))
    surface = payload.get("surface", "mixed path")
    elevation = payload.get("elevation", []) or []
    tag = (payload.get("tag") or "").lower()
    r = _relief(elevation)
    relief = r["relief"]

    # Terrain character.
    if relief <= 15:
        terrain = "flat and forgiving, with ground that barely tilts under you"
        legs = "Your legs stay fresh the whole way, so it feels like you can float over it."
    elif relief <= 45:
        terrain = "gently rolling, with a few soft rises that break up the rhythm"
        legs = "Expect a mild burn on the way up and easy, freewheeling downs."
    elif relief <= 90:
        terrain = "genuinely undulating, with real climbs that get answered by rewarding descents"
        legs = "Your quads will feel the climbs and your calves will feel the pace changes."
    else:
        terrain = "hilly and honest, with a proper valley to drop into and climb back out of"
        legs = "Save a little in the tank, because that last climb will ask for it."

    # Effort framing.
    if dist <= 4:
        effort = "a short, punchy outing"
    elif dist <= 8:
        effort = "a solid run of medium length"
    elif dist <= 13:
        effort = "a longer, steady effort"
    else:
        effort = "a big endurance day"

    surface_note = {
        "paved path": "Smooth pavement gives you predictable footing and fast, even splits.",
        "gravel trail": "The crushed gravel softens each landing while it nudges your effort up a notch.",
        "rail trail": "The old rail grade runs straight and nearly level, so it is easy to lock into a rhythm.",
        "mixed trail": "Surfaces shift between packed dirt and pavement, so stay light and adaptable on your feet.",
        "mixed path": "A blend of pavement and park path keeps the footing easy while the scenery keeps changing.",
    }.get(surface.lower(), "The footing stays runnable throughout.")

    sensations = (
        "Early on you settle into an easy cadence. "
        f"As the route opens up it becomes {terrain}. {legs} "
        "By the final stretch you feel warm through the chest and loose in the hips, "
        "and you finish with that clean, earned tiredness rather than hitting a wall."
    )

    prep = []
    if r["gain"] >= 120:
        prep.append("bring a little extra fuel for the climbing")
    if surface.lower() in ("gravel trail", "mixed trail"):
        prep.append("trail shoes with grip will help on the loose sections")
    if dist >= 12:
        prep.append("carry water for the longer stretches")
    prep_line = (" Before you head out, " + ", and ".join(prep) + ".") if prep else ""

    return (
        f"{name} is {effort} of about {dist:.1f} km, {terrain}. "
        f"{surface_note} {sensations}{prep_line}"
    )


def summarize(payload: dict) -> dict:
    """Handler for the ``route_summary`` task. Returns a summary dict."""
    text: str | None = None
    source = "heuristic"

    if settings.OPENAI_API_KEY:
        try:
            from openai import OpenAI

            client = OpenAI(api_key=settings.OPENAI_API_KEY)
            r = _relief(payload.get("elevation", []) or [])
            prompt = (
                "You are StrideSense, a running guide. In four or five vivid sentences, describe "
                "what this run will look like and what sensations the runner should expect, "
                "covering footing, climbs, breathing, and how the legs will feel, plus what to "
                "prepare for. Be concrete and grounded, not flowery. Write in plain, natural "
                "English. Do not use em dashes or hyphens; use commas and short sentences instead.\n\n"
                f"Route: {payload.get('name')}\n"
                f"Distance: {payload.get('distance_km')} km\n"
                f"Surface: {payload.get('surface')}\n"
                f"Elevation gain: {r['gain']} m, relief {r['relief']} m\n"
                f"Character tag: {payload.get('tag')}\n"
            )
            resp = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.6,
            )
            text = resp.choices[0].message.content
            source = "openai"
        except Exception:
            text = None

    if not text:
        text = _heuristic(payload)

    return {
        "summary": text.strip(),
        "source": source,
        "stats": _relief(payload.get("elevation", []) or []),
    }
