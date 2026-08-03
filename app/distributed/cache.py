"""Distributed cache with a Redis backend and an in-process fallback.

The interface is intentionally tiny (``get_json`` / ``set_json`` / ``incr``) so
call sites don't care which backend is live. When ``REDIS_URL`` is set the cache
is shared across every API replica (a true distributed cache); otherwise it is a
thread-safe, TTL-aware dict local to the process.
"""

from __future__ import annotations

import json
import threading
import time
from typing import Any

from ..config import settings


class _InMemoryCache:
    """Thread-safe TTL cache — the graceful fallback when Redis is absent."""

    backend = "in-process"

    def __init__(self) -> None:
        self._store: dict[str, tuple[float | None, str]] = {}
        self._lock = threading.Lock()

    def _live(self, key: str) -> str | None:
        item = self._store.get(key)
        if item is None:
            return None
        expires, value = item
        if expires is not None and expires < time.time():
            self._store.pop(key, None)
            return None
        return value

    def get_json(self, key: str) -> Any | None:
        with self._lock:
            raw = self._live(key)
        return json.loads(raw) if raw is not None else None

    def set_json(self, key: str, value: Any, ttl: int | None = None) -> None:
        expires = time.time() + ttl if ttl else None
        with self._lock:
            self._store[key] = (expires, json.dumps(value))

    def incr(self, key: str, ttl: int | None = None) -> int:
        with self._lock:
            raw = self._live(key)
            n = int(raw) + 1 if raw is not None else 1
            expires = time.time() + ttl if ttl else None
            self._store[key] = (expires, str(n))
            return n


class _RedisCache:
    """Shared cache backed by Redis — enables horizontal scaling of the API."""

    backend = "redis"

    def __init__(self, client: Any) -> None:
        self._r = client

    def get_json(self, key: str) -> Any | None:
        raw = self._r.get(key)
        return json.loads(raw) if raw is not None else None

    def set_json(self, key: str, value: Any, ttl: int | None = None) -> None:
        self._r.set(key, json.dumps(value), ex=ttl)

    def incr(self, key: str, ttl: int | None = None) -> int:
        n = self._r.incr(key)
        if ttl and n == 1:
            self._r.expire(key, ttl)
        return int(n)


def _build():
    if settings.REDIS_URL:
        try:
            import redis  # type: ignore

            client = redis.Redis.from_url(settings.REDIS_URL, decode_responses=True)
            client.ping()
            return _RedisCache(client)
        except Exception:
            # Redis configured but unreachable → fall back rather than crash.
            pass
    return _InMemoryCache()


cache = _build()
