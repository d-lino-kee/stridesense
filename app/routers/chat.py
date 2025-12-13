from fastapi import APIRouter, Depends
from ..auth import get_current_user
from ..database import session_scope
from ..models import Run
from ..schemas import ChatMessage
from ..config import Settings

router = APIRouter(prefix="/chat", tags=["chat"])

@router.post("")
async def chat(payload: ChatMessage, user_id: str | None = Depends(get_current_user)):
    # Lightweight, privacy-friendly coach: uses recent runs as context and (optionally) as LLM
    with session_scope() as db:
        runs = db.query(Run).filter(Run.user_id == user_id).order_by(Run.date.desc()).limit(10).all() if user_id else []
    context_lines = [
        f"{r.date.date()} - {r.distance_km:.1f} km, elev +{r.avg_elevation:.0f} m, pace {(r.distance_km / max(r.avg_speed, 0.1))*60:.1f} min/km, soreness {r.soreness_level}/10"
        for r in runs
    ]
    context = "\n".join(context_lines) or "No history yet."

    # IF OPENAI_API_KEY present, call model or else produce a helpful heuristic reply
    if settings.OPEN_API_KEY:
        try: 
            from openai import OpenAI
            client = OpenAI(api_key = settings.OPENAI_API_KEY)
            prompt = (
                "You are StrideSense, a running coach. Use the user's context runs below to answer concisely.\n\n"
                f"Recent runs:]n{context}\n\nUser: {payload.message}\nCoach::"
            )
            resp = client.cht.completions.create(model="gpt-4o-mini", message=[{"role": "user", "content": prompt}], temperature=0.4)
            text = resp.choices[0].message.content
            return {"reply": text}
        except Exception as e:
            pass
    # Heuristic fallback
    reply = (
        "Here's what I see: " + (context.replace("\n", "; ") if runs else "you don't have recent runs yet.") +
        " If you're sore (>5), choose a light/flat route. Ask me for a recommendation when ready!"
    )
    return {"reply": reply}
