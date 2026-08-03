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


class DiscoverInput(BaseModel):
    start_lat: float
    start_lng: float
    end_lat: float | None = None
    end_lng: float | None = None
    area: str | None = None  # city / place label for naming
    feeling: str = "mid"
    pref_elevation: str | None = None
    adventure_level: float = Field(default=0.4, ge=0.0, le=1.0)
    rushed: bool = False
    day_of_week: int = 0
    target_distance_km: float | None = None
    time_available_min: int | None = None


class SummaryRequest(BaseModel):
    slug: str
    name: str
    distance_km: float
    surface: str | None = None
    tag: str | None = None
    elevation: list[float] = Field(default_factory=list)


class ReviewIn(BaseModel):
    route_slug: str
    rating: int = Field(ge=1, le=5)
    comment: str = ""
    author: str | None = None
    idempotency_key: str | None = None


class ReviewOut(BaseModel):
    review_id: int
    route_slug: str
    author: str
    rating: int
    comment: str
    created_at: datetime
