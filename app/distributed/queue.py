"""Async task queue with worker pool.

Producers ``submit`` a job and immediately get a ``job_id`` (a 202-style
"accepted" handoff); a pool of background workers drains the queue, runs the
registered handler, and writes the result into the distributed cache where any
replica can read it back by id. This is the classic producer / broker / worker
pattern used to keep request latency low while offloading slow work (here, LLM
route summaries).

Broker: a Redis list (``LPUSH``/``BRPOP``) when ``REDIS_URL`` is set — so workers
in *other* processes can pick up jobs — otherwise an in-process ``queue.Queue``.
"""

from __future__ import annotations

import json
import queue
import threading
import time
import uuid
from typing import Any, Callable

from ..config import settings
from .cache import cache
from .node import NODE

Handler = Callable[[dict], dict]

JOB_TTL = 1800  # seconds a finished job stays readable
_QUEUE_KEY = "queue:jobs"


class TaskQueue:
    def __init__(self) -> None:
        self._handlers: dict[str, Handler] = {}
        self._local_q: "queue.Queue[str]" = queue.Queue()
        self._threads: list[threading.Thread] = []
        self._started = False
        self._redis = self._connect_redis()
        self.backend = "redis" if self._redis else "in-process"

    # -- setup -----------------------------------------------------------
    def _connect_redis(self):
        if not settings.REDIS_URL:
            return None
        try:
            import redis  # type: ignore

            c = redis.Redis.from_url(settings.REDIS_URL, decode_responses=True)
            c.ping()
            return c
        except Exception:
            return None

    def register(self, kind: str, handler: Handler) -> None:
        self._handlers[kind] = handler

    def start(self, workers: int = 2) -> None:
        if self._started:
            return
        self._started = True
        for i in range(max(1, workers)):
            t = threading.Thread(target=self._worker_loop, name=f"tq-worker-{i}", daemon=True)
            t.start()
            self._threads.append(t)

    # -- producer --------------------------------------------------------
    def submit(self, kind: str, payload: dict, dedupe_key: str | None = None) -> str:
        # Idempotent submit: identical work reuses the same job id.
        if dedupe_key:
            existing = cache.get_json(f"dedupe:{dedupe_key}")
            if existing:
                return existing["job_id"]

        job_id = uuid.uuid4().hex
        self._write(job_id, {"job_id": job_id, "kind": kind, "status": "queued", "result": None})
        envelope = json.dumps({"job_id": job_id, "kind": kind, "payload": payload})

        if self._redis:
            self._redis.lpush(_QUEUE_KEY, envelope)
        else:
            self._local_q.put(envelope)

        if dedupe_key:
            cache.set_json(f"dedupe:{dedupe_key}", {"job_id": job_id}, ttl=JOB_TTL)
        return job_id

    def result(self, job_id: str) -> dict | None:
        return cache.get_json(f"job:{job_id}")

    # -- consumer --------------------------------------------------------
    def _worker_loop(self) -> None:
        while True:
            envelope = self._next()
            if envelope is None:
                continue
            try:
                job = json.loads(envelope)
            except Exception:
                continue
            self._process(job)

    def _next(self) -> str | None:
        if self._redis:
            try:
                item = self._redis.brpop(_QUEUE_KEY, timeout=5)
                return item[1] if item else None
            except Exception:
                time.sleep(1)
                return None
        try:
            return self._local_q.get(timeout=5)
        except queue.Empty:
            return None

    def _process(self, job: dict) -> None:
        job_id, kind, payload = job["job_id"], job["kind"], job.get("payload", {})
        handler = self._handlers.get(kind)
        self._write(job_id, {"job_id": job_id, "kind": kind, "status": "running", "result": None,
                             "node_id": NODE.id})
        if handler is None:
            self._write(job_id, {"job_id": job_id, "kind": kind, "status": "failed",
                                 "error": f"no handler for '{kind}'", "node_id": NODE.id})
            return
        try:
            result = handler(payload)
            self._write(job_id, {"job_id": job_id, "kind": kind, "status": "done",
                                 "result": result, "node_id": NODE.id})
        except Exception as e:  # pragma: no cover - defensive
            self._write(job_id, {"job_id": job_id, "kind": kind, "status": "failed",
                                 "error": str(e), "node_id": NODE.id})

    def _write(self, job_id: str, state: dict) -> None:
        cache.set_json(f"job:{job_id}", state, ttl=JOB_TTL)

    def info(self) -> dict:
        depth = 0
        try:
            depth = self._redis.llen(_QUEUE_KEY) if self._redis else self._local_q.qsize()
        except Exception:
            pass
        return {"backend": self.backend, "workers": len(self._threads), "queue_depth": depth}


task_queue = TaskQueue()
