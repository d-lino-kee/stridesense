from pydantic_setting import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="allow")

    APP_NAME: str = "StrideSense API"
    APP_BASE_URL: str = "http://localhost:8000"
    FRONTEND_ORIGIN: str = "http://localhost:5173"

    # DB
    DATABASE_URL: str = "sqlite:///./stridesense.db" # using sync SQLAlchemy

    # FIREBASE
    FIREBASE_CREDENTIALS_JSON: str | None = None

    # Strava
    STRAVA_CLIENT_ID: str | None = None
    STRAVA_CLIENT_SECRET: str | None = None
    STRAVA_REDIRECT_PATH: str = "/oauth/strava/callback"

    # Google APIs
    GOOGLE_MAPS_API_KEY: str | None = None

    # LLM (optional)
    OPEN_API_KEY: str | None = None

settings = Settings()