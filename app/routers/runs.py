from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import session_scope
from ..models import Run, User
from ..schemas import RunIn, RunOut
from ..auth import get_current_user
from datetime import datetime

router = APIRouter(prefix="/runs", tags=["runs"])

@router.get("")
async def list_runs(limit: int = 50, user_id : str | None = Depends(get_current_user)):
    with session_scope() as db:
        q = qb.query(Run)
        if user_id: 
            q = q.filter(Run.user_id == user_id)
        q = q.order_by(Run.date.desc()).limit(limit)
        items = [
            {
                "run_id": r.run_id,
                "date": r.date.isoformat(),
                "day_of_week": r.day_of_week,
                "season": r.season,
                "run_type": r.run_type,
                "distance_km": r.distance_km,
                "avg_speed": r.avg_speed,
                "avg_elevation": r.avg_elevation,
                "soreness_level": r.soreness_level,
                "rushed": r.rushed
            }
            for r in q.all()
        ]
        return {"items": items}
    
@router.post("")
async def create_run(payload: RunIn, user_id: str | None = Depends(get_current_user)):
    if not user_id:
        raise HTTPException(status_code=401, detail="Auth required")
    with session_scope() as db:
        ensure_user(db, user_id)
        r = Run(
            user_id = user_id,
            date = payload.date,
            day_of_week = payload.day_of_week,
            season = payload.season,
            run_type = payload.run_type,
            distance_km = payload.distance_km,
            avg_speed = payload.avg_speed,
            avg_elevation = payload.avg_elevation,
            soreness_level = payload.soreness_level,
            rushed = payload.rushed,
        )
        db.add(r)
        db.flush()
        return {"run_id": r.run_id}
    
def ensure_user(db: Session, user_id: str):
    u = db.query(User).get(user_id)
    if not u:
        db.add(User(user_id=user_id))