# StrideSense

**Multi-framework running recommendation platform.** StrideSense looks at your Strava history and
the terrain around you, then uses a scikit-learn model to work out which routes actually suit you
right now. Tell it how you feel and it recommends a run to match. The more you log, the better its
picks get.

It is built with **Next.js + TypeScript** on the frontend, **FastAPI** on the backend,
**scikit-learn** for the model, **Redux Toolkit** for state, and **PostgreSQL** for storage.

---

## Features

- **Route suitability model** — a `RandomForestRegressor` scores candidate routes against your
  fitness level, pace trends, terrain preference, and how rushed/adventurous you feel.
- **Personalized recommendations** — pick a feeling (jog / light / mid / marathon), and the model
  ranks routes and returns the best match with a suitability score and predicted soreness.
- **Strava import** — OAuth flow pulls your recent runs to personalize scoring.
- **Google Maps enrichment** — directions and elevation-along-path helpers for route data.
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
| Auth       | Firebase Authentication (Google) |
| Integrations | Strava API, Google Maps (Directions + Elevation) |

---

## Architecture

```
Next.js (frontend/)  ──HTTP──►  FastAPI (app/)
  Redux store                     ├─ routers/  runs, routes, recommend, oauth, chat
  Firebase auth token             ├─ ml/       featurizer → model → trainer  (RandomForest)
  Tailwind UI                     ├─ integrations/  strava, maps
                                  └─ SQLAlchemy ► PostgreSQL / SQLite
```

When the API starts up it creates the database tables, drops in some demo data if the database is
empty, and trains the soreness and suitability models. The suitability model begins from a simple
heuristic and then retrains on the runs you log, so its recommendations keep improving as you go.

```
app/
├─ main.py            # app + CORS + lifespan (create/seed/train)
├─ config.py          # pydantic-settings (env-driven)
├─ database.py        # SQLAlchemy engine + session scope
├─ models.py          # User, Run, Route
├─ schemas.py         # Pydantic request/response models
├─ auth.py            # Firebase token verification (optional; None = public demo)
├─ routers/           # runs, routes, recommend, oauth, chat
├─ ml/                # featurizer, model, trainer
└─ integrations/      # strava, maps

frontend/app/
├─ page.tsx           # landing / hero
├─ dashboard/         # auth-guarded dashboard
├─ login/  profile/   # Firebase auth pages
├─ components/        # Recommendation, Charts, Routes, History, Chat, Strava, NavBar…
├─ store/             # Redux slices (user, runs)
├─ providers/         # Auth + Redux providers
└─ firebase/          # client SDK init
```

---

## Getting started

### Prerequisites

- **Node.js** 18+ and **Python** 3.11+
- A **PostgreSQL** database (or use the SQLite override below for zero-setup local dev)
- A **Firebase** project with Google sign-in enabled
- *(Optional)* Strava, Google Maps, and OpenAI API credentials

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

On first boot the API seeds demo runs/routes and trains the models automatically.

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
| `GOOGLE_MAPS_API_KEY` | Google Maps Directions + Elevation. |
| `OPENAI_API_KEY` | *(Optional)* powers the coach chat; falls back to a heuristic if unset. |

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
| `GET`  | `/routes` | List saved routes. |
| `POST` | `/routes` | Save a route *(auth required)*. |
| `POST` | `/recommend` | Rank routes and return the best pick with suitability + predicted soreness. |
| `GET`  | `/oauth/strava/start` | Begin Strava OAuth. |
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
