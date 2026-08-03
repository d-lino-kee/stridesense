"""Route Intelligence service.

A self-contained slice of the API responsible for AI route summaries and
runner reviews. It leans on the distributed-systems primitives:

* summaries are produced **asynchronously** via the task queue + worker pool and
  cached, so a slow LLM call never blocks the request thread;
* review writes are made **idempotent** and race-free with a distributed lock;
* aggregate ratings are served from the **distributed cache** and invalidated on
  write.

This router is deliberately decoupled (its own prefix, models by slug, no
foreign keys into it) so it could be split into a standalone microservice with
no code change beyond the import wiring.
"""

from __future__ import annotations

import hashlib

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func

from ..auth import get_current_user
from ..database import session_scope
from ..distributed import cache, distributed_lock, task_queue
from ..distributed.node import NODE
from ..models import Review
from ..route_intel.summarizer import summarize
from ..schemas import ReviewIn, SummaryRequest

router = APIRouter(prefix="/route-intel", tags=["route-intel"])

# Register the summary handler exactly once.
task_queue.register("route_summary", summarize)

_SUMMARY_TTL = 60 * 60 * 24  # a route's terrain doesn't change day to day
_RATING_TTL = 60 * 5


def _fingerprint(payload: dict) -> str:
    raw = f"{payload.get('slug')}|{payload.get('distance_km')}|{payload.get('elevation')}"
    return hashlib.sha1(raw.encode()).hexdigest()[:16]


@router.post("/summary")
async def request_summary(payload: SummaryRequest):
    """Submit an async summary job. Returns immediately with a job id.

    If an identical route was summarised recently, the deduped job is already
    ``done`` and we hand the result straight back so the client renders instantly.
    """
    body = payload.model_dump()
    fp = _fingerprint(body)

    existing = cache.get_json(f"dedupe:{fp}")
    if existing:
        state = task_queue.result(existing["job_id"])
        if state and state.get("status") == "done":
            return {"job_id": existing["job_id"], "status": "done",
                    "result": state["result"], "cached": True}

    # Dedupe concurrent requests for the same route into one job.
    job_id = task_queue.submit("route_summary", body, dedupe_key=fp)
    return {"job_id": job_id, "status": "queued", "cached": False}


@router.get("/summary/{job_id}")
async def poll_summary(job_id: str):
    state = task_queue.result(job_id)
    if state is None:
        raise HTTPException(status_code=404, detail="Unknown job")
    return state


@router.get("/reviews")
async def list_reviews(route_slug: str):
    agg_key = f"rating:{route_slug}"
    agg = cache.get_json(agg_key)

    with session_scope() as db:
        rows = (
            db.query(Review)
            .filter(Review.route_slug == route_slug)
            .order_by(Review.created_at.desc())
            .all()
        )
        items = [
            {
                "review_id": r.review_id,
                "route_slug": r.route_slug,
                "author": r.author,
                "rating": r.rating,
                "comment": r.comment,
                "created_at": r.created_at.isoformat(),
            }
            for r in rows
        ]
        if agg is None:
            avg, count = db.query(func.avg(Review.rating), func.count(Review.review_id)).filter(
                Review.route_slug == route_slug
            ).one()
            agg = {"average": round(float(avg), 2) if avg else 0, "count": int(count)}
            cache.set_json(agg_key, agg, ttl=_RATING_TTL)

    return {"items": items, "aggregate": agg, "served_by": NODE.id}


@router.post("/reviews")
async def create_review(payload: ReviewIn, user_id: str | None = Depends(get_current_user)):
    author = payload.author or (user_id or "Anonymous")
    idem = payload.idempotency_key or f"{payload.route_slug}:{author}:{payload.rating}:{payload.comment}"
    idem_key = hashlib.sha1(idem.encode()).hexdigest()[:20]

    # Distributed lock makes the write idempotent across replicas + retries.
    with distributed_lock(f"review:{idem_key}", ttl=10) as acquired:
        if not acquired:
            raise HTTPException(status_code=409, detail="Review already being processed")

        seen = cache.get_json(f"review-idem:{idem_key}")
        if seen:
            return {"review_id": seen["review_id"], "deduped": True}

        with session_scope() as db:
            r = Review(
                route_slug=payload.route_slug,
                user_id=user_id,
                author=author,
                rating=payload.rating,
                comment=payload.comment,
            )
            db.add(r)
            db.flush()
            review_id = r.review_id

        cache.set_json(f"review-idem:{idem_key}", {"review_id": review_id}, ttl=_SUMMARY_TTL)
        # Invalidate the cached aggregate so the new rating shows up.
        cache.set_json(f"rating:{payload.route_slug}", None, ttl=1)

    return {"review_id": review_id, "deduped": False, "served_by": NODE.id}


@router.get("/health")
async def health():
    """Node + distributed-subsystem health, for observability / load-balancer checks."""
    return {
        "ok": True,
        "node": NODE.info(),
        "cache": {"backend": cache.backend},
        "queue": task_queue.info(),
    }
