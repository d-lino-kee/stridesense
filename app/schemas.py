from pydantic import BaseModel, Field
from datetime import datetime

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
    feeling: str # jog/light/mid/marathon
    rushed: bool
    day_of_week: int
    pref_elevation: str | None = Field(default=None, description="Flat|up|down")
    adventure_level: float = Field(default=0.3, description="0-1: willingness to try new routes")
    time_available_min: int | None = None

class RecommendationResult(BaseModel):
    route: RouteOut | dict
    predicted_soreness: float
    rationale: str

class ChatMessage(BaseModel):
    message: str