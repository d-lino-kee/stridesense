"""Per-replica identity.

Every running API process ("node") gets a stable id for the lifetime of the
process. Responses and logs carry this id so that, when the service is scaled
to N replicas behind a load balancer, you can observe which node served a
request and confirm that shared state (cache/queue/locks) is genuinely shared.
"""

import os
import socket
import time
import uuid


class _Node:
    def __init__(self) -> None:
        self.id = f"{socket.gethostname()}-{uuid.uuid4().hex[:8]}"
        self.pid = os.getpid()
        self.started_at = time.time()

    @property
    def uptime_s(self) -> float:
        return round(time.time() - self.started_at, 1)

    def info(self) -> dict:
        return {"node_id": self.id, "pid": self.pid, "uptime_s": self.uptime_s}


NODE = _Node()
