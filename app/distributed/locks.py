"""Distributed mutual exclusion.

``distributed_lock`` yields True to exactly one holder of a key at a time. With
Redis it uses the classic ``SET key token NX PX`` acquire + check-and-delete
release, so the lock holds across replicas (e.g. to make review submission
idempotent no matter which node handles the retry). Without Redis it falls back
to a process-local keyed lock.
"""

from __future__ import annotations

import threading
import time
import uuid
from contextlib import contextmanager
from typing import Iterator

from ..config import settings

_local_locks: dict[str, threading.Lock] = {}
_registry_lock = threading.Lock()


def _redis_client():
    if not settings.REDIS_URL:
        return None
    try:
        import redis  # type: ignore

        c = redis.Redis.from_url(settings.REDIS_URL, decode_responses=True)
        c.ping()
        return c
    except Exception:
        return None


@contextmanager
def distributed_lock(key: str, ttl: int = 10, wait: float = 3.0) -> Iterator[bool]:
    """Context manager yielding True if the lock was acquired, else False."""
    r = _redis_client()
    lock_key = f"lock:{key}"

    if r is not None:
        token = uuid.uuid4().hex
        deadline = time.time() + wait
        acquired = False
        while time.time() < deadline:
            if r.set(lock_key, token, nx=True, px=int(ttl * 1000)):
                acquired = True
                break
            time.sleep(0.05)
        try:
            yield acquired
        finally:
            if acquired:
                # Release only if we still own it (avoid deleting another node's lock).
                try:
                    if r.get(lock_key) == token:
                        r.delete(lock_key)
                except Exception:
                    pass
        return

    # In-process fallback.
    with _registry_lock:
        lock = _local_locks.setdefault(lock_key, threading.Lock())
    acquired = lock.acquire(timeout=wait)
    try:
        yield acquired
    finally:
        if acquired:
            lock.release()
