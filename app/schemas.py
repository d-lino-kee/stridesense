from datetime import datetime
from pydantic import BaseModel, Field


class RunIn(BaseModel):
    date: datetime
    day_of_week: int
    season: str
    run_type: str
    distance_km: float
    avg_speed: float
    avg_elevation: float
    soreness_level: int
    rushed: bool = False


class RunOut(RunIn):
    run_id: int


class RouteIn(BaseModel):
    name: str
    distance_km: float
    elevation_gain: float
    map_data: dict | None = None


class RouteOut(RouteIn):
    route_id: int


class RecommendationInput(BaseModel):
    feeling: str  # jog/light/mid/marathon
    rushed: bool = False
    day_of_week: int
    pref_elevation: str | None = Field(default=None, description="flat|up|down")
    adventure_level: float = Field(default=0.3, description="0-1: willingness to try new routes")
    time_available_min: int | None = None
    origin_lat: float | None = None
    origin_lng: float | None = None


class RecommendationResult(BaseModel):
    route: RouteOut | dict
    predicted_soreness: float
    suitability_score: float
    rationale: str


class ChatMessage(BaseModel):
    message: str
