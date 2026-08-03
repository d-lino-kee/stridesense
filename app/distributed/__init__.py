"""Distributed-systems primitives for StrideSense.

This package gives the API the building blocks of a horizontally-scalable
service — a shared cache, an async task queue, and distributed locks — each
backed by Redis when ``REDIS_URL`` is configured and degrading gracefully to
an in-process implementation for zero-infra local development.

See ``DISTRIBUTED_SYSTEMS.md`` for the architecture.
"""

from .node import NODE
from .cache import cache
from .locks import distributed_lock
from .queue import task_queue

__all__ = ["NODE", "cache", "distributed_lock", "task_queue"]
