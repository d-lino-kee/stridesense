from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .database import engine, Base, session_scope
from .models import Run, Route
from .routers import runs as runs_router
from .routers import routes as routes_router
from .routers import recommend as recommend_router
from .routers import oauth as oauth_router
from .routers import chat as chat_router
from .routers import route_intel as route_intel_router
from .routers import geo as geo_router
from .routers import discover as discover_router
from .ml.trainer import train_soreness_model, train_suitability_model
from .config import settings as _settings
from .distributed import task_queue, cache
from .distributed.node import NODE


def _run_rows(db) -> list[dict]:
    return [
        {
            "distance_km": r.distance_km,
            "avg_speed": r.avg_speed,
            "avg_elevation": r.avg_elevation,
            "rushed": r.rushed,
            "run_type": r.run_type,
            "day_of_week": r.day_of_week,
            "soreness_level": r.soreness_level,
        }
        for r in db.query(Run).all()
    ]


def _route_rows(db) -> list[dict]:
    return [
        {"distance_km": r.distance_km, "elevation_gain": r.elevation_gain}
        for r in db.query(Route).all()
    ]


def _ensure_run_columns() -> None:
    """Add newer columns to an existing runs table (tiny idempotent migration)."""
    from sqlalchemy import text

    for col in ("name VARCHAR", "notes VARCHAR"):
        try:
            with engine.begin() as conn:
                conn.execute(text(f"ALTER TABLE runs ADD COLUMN {col}"))
        except Exception:
            pass  # column already exists


@asynccontextmanager
async def lifespan(_: FastAPI):
    """Create tables, seed demo data on first boot, and train the ML models."""
    Base.metadata.create_all(engine)
    _ensure_run_columns()

    with session_scope() as db:
        has_data = db.query(Route).count() > 0
    if not has_data:
        try:
            from .seed import seed

            seed()
        except Exception:
            # Seeding is best-effort — the app still runs (with fallbacks) without it.
            pass

    with session_scope() as db:
        run_rows = _run_rows(db)
        route_rows = _route_rows(db)
    train_soreness_model(run_rows)
    train_suitability_model(run_rows, route_rows)

    # Start the distributed task-queue worker pool (drains route-summary jobs).
    task_queue.start(workers=_settings.SUMMARY_WORKERS)
    print(
        f"[distributed] node={NODE.id} cache={cache.backend} "
        f"queue={task_queue.backend} workers={_settings.SUMMARY_WORKERS}"
    )
    yield


app = FastAPI(title=settings.APP_NAME, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_ORIGIN],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"ok": True, "app": settings.APP_NAME}


app.include_router(runs_router.router)
app.include_router(routes_router.router)
app.include_router(recommend_router.router)
app.include_router(oauth_router.router)
app.include_router(chat_router.router)
app.include_router(route_intel_router.router)
app.include_router(geo_router.router)
app.include_router(discover_router.router)
