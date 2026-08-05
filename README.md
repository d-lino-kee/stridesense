# StrideSense

**Multi-framework running recommendation platform.** StrideSense looks at your Strava history and
the terrain around you, then uses a scikit-learn model to work out which routes actually suit you
right now. Tell it how you feel and where you are, and it generates and ranks real routes to match.
The more you log, the better its picks get.

It is built with **Next.js + TypeScript** on the frontend, **FastAPI** on the backend,
**scikit-learn** for the model, **Redux Toolkit** for state, and **PostgreSQL** for storage, with a
small **distributed-systems layer** (shared cache, async task queue, distributed locks) that powers
the Route Intelligence service and lets the API scale horizontally.

---

## Features

- **Route suitability model** — a `RandomForestRegressor` scores candidate routes against your
  fitness level, pace trends, terrain preference, and how rushed/adventurous you feel.
- **Personalized recommendations** — pick a feeling (jog / light / mid / marathon), and the model
  ranks routes and returns the best match with a suitability score and predicted soreness.
- **Route discovery & planner** — from a start point (and optional finish), StrideSense
  *procedurally generates* candidate routes — loops, out-and-backs, and point-to-point paths — as
  real lat/lng waypoints with plausible elevation profiles, ranks them with the ML model, and names
  each one after the neighborhood it runs through.
- **Location search** — type-ahead city and start/finish search with no API key required, proxied
  server-side through the Photon (OpenStreetMap) geocoder and cached.
- **Route Intelligence** — AI-written, sensation-focused route summaries generated **asynchronously**
  on a worker pool (so a slow LLM call never blocks the request), plus **runner reviews** with
  ratings, made idempotent and race-free with distributed locks and served from a cached aggregate.
- **Strava import** — OAuth flow pulls your recent runs to personalize scoring (with a demo import
  for trying it without a Strava app).
- **Run history management** — log, edit, and delete runs, each with a name and notes.
- **Trends dashboard** — distance, pace, and soreness over time (Recharts).
- **Coach chat** — a lightweight running coach grounded in your run history (optional OpenAI backend,
  with a heuristic fallback).
- **Firebase Google auth** — sign in to keep runs, routes, and recommendations in sync.

---

## Tech stack

| Layer      | Technology |
|------------|------------|
| Frontend   | Next.js 14 (App Router), TypeScript, Tailwind CSS, Redux Toolkit, Recharts |
| Backend    | FastAPI, SQLAlchemy 2.0, Pydantic v2 |
| ML         | scikit-learn (RandomForest), NumPy, joblib |
| Data       | PostgreSQL (SQLite override for local dev) |
| Distributed | Redis-backed cache / task queue / locks, with in-process fallback |
| Auth       | Firebase Authentication (Google) |
| Integrations | Strava API, Google Maps (Directions embed), Photon geocoder (OSM), OpenAI *(optional)* |

---

## Architecture

```
Next.js (frontend/)  ──HTTP──►  FastAPI (app/)
  Redux store                     ├─ routers/       runs, routes, recommend, oauth, chat,
  Firebase auth token             │                 discover, geo, route_intel
  Tailwind UI                     ├─ ml/            featurizer → model → trainer  (RandomForest)
  Google Maps embed               ├─ route_intel/   route generator, geocoding, AI summarizer
                                  ├─ distributed/   cache, task queue, locks, node  (Redis / in-proc)
                                  ├─ integrations/  strava, maps
                                  └─ SQLAlchemy ►   PostgreSQL / SQLite
```

When the API starts up it creates the database tables, applies a tiny idempotent migration, drops in
some demo data if the database is empty, trains the soreness and suitability models, and starts the
task-queue worker pool. The suitability model begins from a simple heuristic and then retrains on the
runs you log, so its recommendations keep improving as you go.

```
app/
├─ main.py            # app + CORS + lifespan (create/seed/train/start workers)
├─ config.py          # pydantic-settings (env-driven)
├─ database.py        # SQLAlchemy engine + session scope
├─ models.py          # User, Run, Route, Review
├─ schemas.py         # Pydantic request/response models
├─ auth.py            # Firebase token verification (optional; None = public demo)
├─ http_util.py       # small shared HTTP helper
├─ routers/           # runs, routes, recommend, oauth, chat, discover, geo, route_intel
├─ ml/                # featurizer, model, trainer
├─ route_intel/       # discover (route generator), places (reverse-geocode), summarizer
├─ distributed/       # cache, queue, locks, node  (see DISTRIBUTED_SYSTEMS.md)
└─ integrations/      # strava, maps

frontend/app/
├─ page.tsx           # landing / hero
├─ dashboard/         # auth-guarded dashboard
├─ discover/          # route discovery & planner
├─ route/[slug]/      # route detail (summary + reviews)
├─ login/  profile/   # Firebase auth pages
├─ components/        # Recommendation, Charts, History, Chat, Strava, Planner, Discover, NavBar…
├─ store/             # Redux slices (user, runs)
├─ providers/         # Auth + Redux providers
└─ firebase/          # client SDK init
```

---

## Distributed systems layer

The **Route Intelligence** service is built on a small set of distributed-systems primitives so the
API can run as a single process locally *and* scale to N replicas behind a load balancer with no code
changes:

- **Shared cache** — geocodes, route summaries, and rating aggregates.
- **Async task queue + worker pool** — route summaries are submitted as jobs and drained by background
  workers, with request-level deduplication.
- **Distributed locks** — make review writes idempotent and race-free across replicas and retries.

Each primitive uses Redis when `REDIS_URL` is set (shared across replicas) and degrades gracefully to
an in-process implementation for zero-infra local dev. See **[DISTRIBUTED_SYSTEMS.md](DISTRIBUTED_SYSTEMS.md)**
for the full architecture.

---

## Getting started

### Prerequisites

- **Node.js** 18+ and **Python** 3.11+
- A **PostgreSQL** database (or use the SQLite override below for zero-setup local dev)
- A **Firebase** project with Google sign-in enabled
- *(Optional)* Redis (for multi-replica scaling), and Strava, Google Maps, and OpenAI API credentials

### 1. Backend

```bash
# from the repo root
python -m venv .venv
.venv\Scripts\activate            # Windows
# source .venv/bin/activate       # macOS / Linux
pip install -r requirements.txt

cp .env.example .env              # then edit values (see below)
uvicorn app.main:app --reload     # http://localhost:8000
```

For zero-setup local dev without PostgreSQL, override the database in `.env`:

```
DATABASE_URL=sqlite:///./stridesense.db
```

On first boot the API seeds demo runs/routes, trains the models, and starts the summary workers
automatically. Location search and route discovery work out of the box — no API keys required.

### 2. Frontend

```bash
cd frontend
npm install
# frontend/.env.local — API base + Firebase web config
npm run dev                       # http://localhost:3000
```

---

## Configuration

### Backend — `.env` (see `.env.example`)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | SQLAlchemy URL. Postgres by default; `sqlite:///./stridesense.db` for local. |
| `FRONTEND_ORIGIN` | Allowed CORS origin (default `http://localhost:3000`). |
| `FIREBASE_CREDENTIALS_JSON` | Path to a Firebase service-account JSON (enables token verification). |
| `STRAVA_CLIENT_ID` / `STRAVA_CLIENT_SECRET` | Strava OAuth app credentials. |
| `GOOGLE_MAPS_API_KEY` | Google Maps Directions embed / elevation (frontend route drawing). |
| `OPENAI_API_KEY` | *(Optional)* powers the coach chat and route summaries; both fall back to a heuristic if unset. |
| `REDIS_URL` | *(Optional)* enables the shared cache, task queue, and locks across replicas. In-process fallback if unset. |
| `SUMMARY_WORKERS` | Number of async workers draining the route-summary queue (default `2`). |

### Frontend — `frontend/.env.local`

```
NEXT_PUBLIC_API_BASE=http://localhost:8000
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

> Firebase web API keys are safe to expose in the client. They identify the project rather than
> granting access, so they are not a secret.

---

## API reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`  | `/` | Health check. |
| `GET`  | `/runs?limit=` | List the current user's runs. |
| `POST` | `/runs` | Log a run *(auth required)*. |
| `PATCH`| `/runs/{run_id}` | Edit a run *(auth required)*. |
| `DELETE`| `/runs/{run_id}` | Delete a run *(auth required)*. |
| `GET`  | `/routes` | List saved routes. |
| `POST` | `/routes` | Save a route *(auth required)*. |
| `POST` | `/recommend` | Rank routes and return the best pick with suitability + predicted soreness. |
| `POST` | `/discover` | Generate candidate routes near a start/finish and return the top ranked, named picks. |
| `GET`  | `/geo/search?q=` | Type-ahead city / location search (Photon geocoder). |
| `POST` | `/route-intel/summary` | Submit an async AI route-summary job → returns a job id. |
| `GET`  | `/route-intel/summary/{job_id}` | Poll a summary job for its result. |
| `GET`  | `/route-intel/reviews?route_slug=` | List reviews + cached rating aggregate for a route. |
| `POST` | `/route-intel/reviews` | Post a runner review (idempotent). |
| `GET`  | `/route-intel/health` | Node + distributed-subsystem health. |
| `GET`  | `/oauth/strava/start` | Begin Strava OAuth. |
| `POST` | `/oauth/strava/demo` | Import a demo set of activities without a Strava app. |
| `GET`  | `/oauth/strava/callback` | Strava OAuth callback → imports activities. |
| `POST` | `/chat` | Coach chat grounded in run history. |

When you are signed in, requests carry a Firebase ID token in the `Authorization: Bearer <token>`
header. If no token is supplied the endpoints fall back to a public demo mode where `user_id` is
`None`.

Interactive docs are available at `http://localhost:8000/docs`.

---

## The ML model

- **Featurizer** (`app/ml/featurizer.py`) — builds feature vectors for soreness (from run history)
  and suitability (route × context × user stats), plus a heuristic label used to bootstrap training.
- **Model** (`app/ml/model.py`) — two `RandomForestRegressor`s (soreness, suitability) persisted with
  joblib. `rank_candidates` scores and sorts the routes.
- **Trainer** (`app/ml/trainer.py`) — derives user stats from runs and (re)trains both models. The
  suitability model starts from synthesized labels and improves as real runs accumulate.

Route discovery (`app/route_intel/discover.py`) generates the candidate routes that these models
score, so the "top picks" surfaced in the planner reflect the user's ML parameters.

---

## Scripts

```bash
# Backend
uvicorn app.main:app --reload      # dev server
python -m app.seed                 # (re)seed demo data

# Frontend (in frontend/)
npm run dev                        # dev server
npm run build                      # production build
npm run lint                       # eslint
```
