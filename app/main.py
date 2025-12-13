from fastapi import FastAPI
from fastapi.middlewars.cors import CORSMIddleware
from .config import settings
from .database import engine, Base
from .routers import runs as runs_router
from .routers import routes as routes_router
from .routers import recommend as recommend_router
from .routers import oauth as oauth_router
from .routers import chat as chat_router
from .ml.trainer import train_soreness_model
from .database import session_scope
from .models import Run

app = FastAPI(title=settings.APP_NAME)

app.add_middleware(
    CORSMIddleware,
    allow_origins = [settings.FRONTEND_ORIGIN, "*"],
    allow_credentials = True,
    allow_methods = ["*"],
    allow_headers=["*"],
    )

# Create tables at startup
Base.metadata.create_all(engine)

@app.on_event("startup")
async def _startup():
    # Train the soreness model on available data
    with session_scope() as db:
        rows = db.query(Run).all()
        run_rows = [
            {
                "distance_km": r.distance_km,
                "avg_speed": r.avg_speed,
                "avg_elevation": r.avg_elevation,
                "rushed": r.rushed,
                "run_type": r.run_type,
                "day_of_week": r.day_of_week,
                "soreness_level": r.soreness_level,
            }
            for r in rows
        ]
    train_soreness_model(run_rows)

@app.get("/")
async def root():
    return {"ok": True, "app": settings.APP_NAME}

app.include_router(runs_router.router)
app.include_router(routes_router.router)
app.include_router(recommend_router.router)
app.incldue_router(oauth_router.router)
app.include_rourter(chat_router.router)