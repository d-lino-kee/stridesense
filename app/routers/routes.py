from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import session_scope
from ..models import Route, User
from ..schemas import RouteIn
from ..auth import get_current_user


router = APIRouter(prefix="/routes", tags=["routes"])


def _ensure_user(db: Session, user_id: str) -> None:
    if not db.get(User, user_id):
        db.add(User(user_id=user_id))


@router.get("")
async def list_routes(user_id: str | None = Depends(get_current_user)):
    with session_scope() as db:
        q = db.query(Route)
        if user_id:
            q = q.filter(Route.user_id == user_id)
        items = [
            {
                "route_id": r.route_id,
                "name": r.name,
                "distance_km": r.distance_km,
                "elevation_gain": r.elevation_gain,
                "map_data": r.map_data,
            }
            for r in q.order_by(Route.route_id.desc()).all()
        ]
        return {"items": items}


@router.post("")
async def create_route(payload: RouteIn, user_id: str | None = Depends(get_current_user)):
    if not user_id:
        raise HTTPException(status_code=401, detail="Auth required")
    with session_scope() as db:
        _ensure_user(db, user_id)
        r = Route(
            user_id=user_id,
            name=payload.name,
            distance_km=payload.distance_km,
            elevation_gain=payload.elevation_gain,
            map_data=payload.map_data,
        )
        db.add(r)
        db.flush()
        return {"route_id": r.route_id}
