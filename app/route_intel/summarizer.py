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
        terrain = "flat and forgiving — the ground barely tilts under you"
        legs = "Your legs stay fresh; this is a route you can float over."
    elif relief <= 45:
        terrain = "gently rolling, with a few soft rises that break up the rhythm"
        legs = "Expect a mild burn on the ups and easy, free-wheeling downs."
    elif relief <= 90:
        terrain = "genuinely undulating — real climbs answered by rewarding descents"
        legs = "Your quads will feel the climbs and your calves the pace changes."
    else:
        terrain = "hilly and demanding, with a proper valley to drop into and climb out of"
        legs = "Save something in the tank: the climb-out will ask for it near the end."

    # Effort framing.
    if dist <= 4:
        effort = "a short, punchy outing"
    elif dist <= 8:
        effort = "a solid mid-length run"
    elif dist <= 13:
        effort = "a longer, steady effort"
    else:
        effort = "a big endurance day"

    surface_note = {
        "paved path": "Smooth pavement means predictable footing and fast, even splits.",
        "gravel trail": "Crushed gravel softens each landing but nudges your effort up a notch.",
        "rail trail": "The old rail grade is dead-straight and near-level — perfect for locking into a rhythm.",
        "mixed trail": "Surfaces shift between packed dirt and pavement, so stay light and adaptable on your feet.",
        "mixed path": "A mix of pavement and park path keeps the footing easy but the scenery changing.",
    }.get(surface.lower(), "The footing stays runnable throughout.")

    sensations = (
        "Early on you'll settle into an easy cadence. "
        f"As the route opens up it becomes {terrain}. {legs} "
        "By the final stretch you'll feel warm through the chest and loose in the hips, "
        "finishing with that clean, earned tiredness rather than a wall."
    )

    prep = []
    if r["gain"] >= 120:
        prep.append("bring a little more fuel for the climbing")
    if surface.lower() in ("gravel trail", "mixed trail"):
        prep.append("trail or grippy shoes will help on the loose sections")
    if dist >= 12:
        prep.append("carry water for the longer stretches")
    prep_line = (" To prepare, " + ", and ".join(prep) + ".") if prep else ""

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
                "You are StrideSense, a running guide. In 4-5 vivid sentences, describe what "
                "this run will LOOK like and what SENSATIONS the runner should expect (footing, "
                "climbs, breathing, how the legs will feel), and what to prepare for. "
                "Be concrete and grounded, not flowery.\n\n"
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
