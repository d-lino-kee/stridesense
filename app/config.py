from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="allow")

    APP_NAME: str = "StrideSense API"
    APP_BASE_URL: str = "http://localhost:8000"
    FRONTEND_ORIGIN: str = "http://localhost:3000"

    # DB — PostgreSQL by default; override with sqlite:/// for local-only dev.
    DATABASE_URL: str = "postgresql+psycopg2://stridesense:stridesense@localhost:5432/stridesense"

    # Firebase
    FIREBASE_CREDENTIALS_JSON: str | None = None

    # Strava
    STRAVA_CLIENT_ID: str | None = None
    STRAVA_CLIENT_SECRET: str | None = None
    STRAVA_REDIRECT_PATH: str = "/oauth/strava/callback"

    # Google APIs
    GOOGLE_MAPS_API_KEY: str | None = None

    # LLM (optional)
    OPENAI_API_KEY: str | None = None


settings = Settings()
