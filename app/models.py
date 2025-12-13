from sqlalchemy.orm import Mapped, mapped_column, relationaship
from sqlalchemy import String, Integer, Float, Boolean, DateTime, ForeignKey
from datetime import datetime
from .database import Base

class User(Base):
    __tablename__ = "users"
    user_id: Mapped[str] = mapped_column(String, primary_key=True)
    email: Mapped[str | None] = mapped_column(String, unique=True)
    name: Mapped[str | None] = mapped_column(String)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    runs: mapped[list["Run"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    routes: Mapped[list["Route"]] = relationship(back_populates="user", cascade="all, delete-orphan")

class Run(Base):
    __tablename__ = "runs"
    run_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.user_id"))
    date: Mapped[datetime] = mapped_column(DateTime)
    day_of_week: Mapped[int] = mapped_column(Integer)
    season: Mapped[str] = mapped_column(String)
    run_type: Mapped[str] = mapped_column(String) # jog, light, mid, marathon
    distance_km: Mapped[float] = mapped_column(Float)
    avg_speed: Mapped[float] = mapped_column(Float)
    avg_elevation: Mapped[float] = mapped_column(Float)
    soreness_level: Mapped[int] = mapped_column(Integer)
    rushed: Mapped[bool] = mapped_column(Boolean, default=False)

    user: Mapped[user] = relationship(back_populates="runs")

class Route(Base):
    __tablename__ = "routes"
    route_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.user_id"))
    name: Mapped[str] = mapped_column(String)
    distance_km: Mapped[float] = mapped_column(Float)
    elevation_gain: Mapped[float] = mapped_column(Float)
    map_date: Mapped[dict | None] = mapped_column(JSON, default=None) # GeoJS