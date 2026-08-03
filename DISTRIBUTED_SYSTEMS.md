# Distributed Systems in StrideSense

StrideSense's **Route Intelligence** service (AI route summaries + runner reviews)
is built on a small set of distributed-systems primitives so the API can run as
one process locally *and* scale horizontally to N replicas behind a load
balancer without code changes. Every primitive has a Redis-backed implementation
(shared across replicas) and an in-process fallback (zero-infra local dev),
selected at startup from `REDIS_URL`.

```
                 ┌─────────────┐        ┌─────────────┐
  Browser ─────► │  API node A │        │  API node B │  ◄──── Browser
                 │  (uvicorn)  │        │  (uvicorn)  │
                 └──────┬──────┘        └──────┬──────┘
                        │  submit job / read cache / lock
                        ▼                      ▼
             ┌───────────────────────────────────────────┐
             │  Shared backplane  (Redis, or in-process)  │
             │   • cache      key/value + TTL             │
             │   • task queue LPUSH / BRPOP broker        │
             │   • locks      SET NX PX                   │
             └───────────────────────────────────────────┘
                        ▲
              worker pool drains the queue, runs the
              LLM summariser, writes results to cache
```

## Concepts incorporated

| Concept | Where | What it does |
|---|---|---|
| **Service decomposition** | `app/routers/route_intel.py`, `app/route_intel/` | Route Intelligence is an independently-deployable slice — its own prefix, keyed by route *slug* with no foreign keys — so it can be lifted into a standalone microservice. |
| **Async task queue (producer/broker/worker)** | `app/distributed/queue.py` | Requests `submit()` a summary job and get a `job_id` back immediately (202-style handoff). A pool of worker threads drains the queue and runs the slow LLM call off the request path. |
| **Distributed cache** | `app/distributed/cache.py` | Finished summaries and rating aggregates are cached with TTLs and read back by any replica. Write-through + invalidation on new reviews. |
| **Distributed locks / mutual exclusion** | `app/distributed/locks.py` | `SET key token NX PX` acquire + check-and-delete release guards review writes. |
| **Idempotency** | `route_intel.create_review`, `queue.submit(dedupe_key=…)` | An idempotency key + lock make review POSTs safe to retry; identical summary requests dedupe onto one job. |
| **Node identity & observability** | `app/distributed/node.py`, `/route-intel/health` | Each replica has a stable `node_id` surfaced in responses (`served_by`) so you can see which node handled a request and confirm shared state. |
| **Graceful degradation** | every module's `_build()` / fallback | If `REDIS_URL` is unset or Redis is unreachable, each primitive transparently falls back to a thread-safe in-process implementation instead of failing. |
| **Statelessness / horizontal scaling** | overall design | Nodes hold no session state; all shared state lives on the backplane, so you can run `uvicorn app.main:app` on many ports/hosts behind a balancer. |

## Request lifecycle — an AI route summary

1. `POST /route-intel/summary` → compute a fingerprint of the route; if a deduped
   job is already `done` in cache, return it immediately (`cached: true`).
2. Otherwise `task_queue.submit()` enqueues the job and returns `{job_id, status:"queued"}`.
3. A **worker thread** pops the job, runs `summarize()` (OpenAI if `OPENAI_API_KEY`,
   else the deterministic engine), and writes the result to the cache under `job:{id}`.
4. The browser polls `GET /route-intel/summary/{job_id}` until `status:"done"`.

## Running as a real distributed system

```bash
# 1. Start Redis (Docker)
docker run -p 6379:6379 redis

# 2. Point the app at it
setx REDIS_URL redis://localhost:6379/0     # or add to .env

# 3. Run several API replicas behind a balancer
uvicorn app.main:app --port 8010
uvicorn app.main:app --port 8011
uvicorn app.main:app --port 8012
```

Now the cache, queue and locks are shared: a job submitted on node A can be
executed by a worker on node B, review idempotency holds across all three, and
`/route-intel/health` on each node reports `cache.backend: "redis"` and
`queue.backend: "redis"`. With Redis absent, the same endpoints keep working on a
single node via the in-process fallback.
```
