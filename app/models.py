from datetime import datetime
from sqlalchemy import String, Integer, Float, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .database import Base


class User(Base):
    __tablename__ = "users"
    user_id: Mapped[str] = mapped_column(String, primary_key=True)
    email: Mapped[str | None] = mapped_column(String, unique=True, nullable=True)
    name: Mapped[str | None] = mapped_column(String, nullable=True)
    fitness_level: Mapped[float] = mapped_column(Float, default=5.0)
    pref_elevation: Mapped[str | None] = mapped_column(String, nullable=True)
    home_lat: Mapped[float | None] = mapped_column(Float, nullable=True)
    home_lng: Mapped[float | None] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    runs: Mapped[list["Run"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    routes: Mapped[list["Route"]] = relationship(back_populates="user", cascade="all, delete-orphan")


class Run(Base):
    __tablename__ = "runs"
    run_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.user_id"))
    date: Mapped[datetime] = mapped_column(DateTime)
    day_of_week: Mapped[int] = mapped_column(Integer)
    season: Mapped[str] = mapped_column(String)
    run_type: Mapped[str] = mapped_column(String)  # jog, light, mid, marathon
    distance_km: Mapped[float] = mapped_column(Float)
    avg_speed: Mapped[float] = mapped_column(Float)
    avg_elevation: Mapped[float] = mapped_column(Float)
    soreness_level: Mapped[int] = mapped_column(Integer)
    rushed: Mapped[bool] = mapped_column(Boolean, default=False)

    user: Mapped["User"] = relationship(back_populates="runs")


class Route(Base):
    __tablename__ = "routes"
    route_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.user_id"))
    name: Mapped[str] = mapped_column(String)
    distance_km: Mapped[float] = mapped_column(Float)
    elevation_gain: Mapped[float] = mapped_column(Float)
    map_data: Mapped[dict | None] = mapped_column(JSON, default=None, nullable=True)

    user: Mapped["User"] = relationship(back_populates="routes")
