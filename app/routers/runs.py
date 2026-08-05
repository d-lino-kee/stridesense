from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import session_scope
from ..models import Run, User
from ..schemas import RunIn, RunUpdate
from ..auth import get_current_user


router = APIRouter(prefix="/runs", tags=["runs"])


def _ensure_user(db: Session, user_id: str) -> None:
    if not db.get(User, user_id):
        db.add(User(user_id=user_id))


def _serialize(r: Run) -> dict:
    return {
        "run_id": r.run_id,
        "name": r.name,
        "notes": r.notes,
        "date": r.date.isoformat(),
        "day_of_week": r.day_of_week,
        "season": r.season,
        "run_type": r.run_type,
        "distance_km": r.distance_km,
        "avg_speed": r.avg_speed,
        "avg_elevation": r.avg_elevation,
        "soreness_level": r.soreness_level,
        "rushed": r.rushed,
    }


@router.get("")
async def list_runs(limit: int = 50, user_id: str | None = Depends(get_current_user)):
    with session_scope() as db:
        q = db.query(Run)
        if user_id:
            q = q.filter(Run.user_id == user_id)
        q = q.order_by(Run.date.desc()).limit(limit)
        return {"items": [_serialize(r) for r in q.all()]}


@router.post("")
async def create_run(payload: RunIn, user_id: str | None = Depends(get_current_user)):
    if not user_id:
        raise HTTPException(status_code=401, detail="Auth required")
    with session_scope() as db:
        _ensure_user(db, user_id)
        r = Run(
            user_id=user_id,
            name=payload.name,
            notes=payload.notes,
            date=payload.date,
            day_of_week=payload.day_of_week,
            season=payload.season,
            run_type=payload.run_type,
            distance_km=payload.distance_km,
            avg_speed=payload.avg_speed,
            avg_elevation=payload.avg_elevation,
            soreness_level=payload.soreness_level,
            rushed=payload.rushed,
        )
        db.add(r)
        db.flush()
        return _serialize(r)


@router.patch("/{run_id}")
async def update_run(
    run_id: int, payload: RunUpdate, user_id: str | None = Depends(get_current_user)
):
    if not user_id:
        raise HTTPException(status_code=401, detail="Auth required")
    with session_scope() as db:
        r = db.get(Run, run_id)
        if not r or r.user_id != user_id:
            raise HTTPException(status_code=404, detail="Run not found")
        for field, value in payload.model_dump(exclude_unset=True).items():
            setattr(r, field, value)
        db.flush()
        return _serialize(r)


@router.delete("/{run_id}")
async def delete_run(run_id: int, user_id: str | None = Depends(get_current_user)):
    if not user_id:
        raise HTTPException(status_code=401, detail="Auth required")
    with session_scope() as db:
        r = db.get(Run, run_id)
        if not r or r.user_id != user_id:
            raise HTTPException(status_code=404, detail="Run not found")
        db.delete(r)
        return {"ok": True, "deleted": run_id}
