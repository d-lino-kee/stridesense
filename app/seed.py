from .database import engine, Base, session_scope
from .models import User, Run, Route
from .utils import season_from_date
from datetime import datetime, timedelta
import random

def seed():
    Base.metadata.create_all(engine)
    user_id = "demo"
    with session_scope() as db:
        if not db.query(User).get(user_id):
            db.add(User(user_id = user_id, email = "demo@example.com", name = "Demo"))
        # seed runs
        today = datetime.utcnow()
        for i in range(20):
            dt = today - timedelta(days=i*2)
            dist = 6 + (i % 5 == 0) * 4 + random.random() * 2
            speed = 10 + random.random() * 3
            elev = 80 + random.random() * 80
            soreness = max(1, min(10, 3 + (dist>10)*2 + (elev>120)))
            db.add(Run(
                user_id = user_id,
                date = dt,
                day_of_week = dt.weekday(),
                season = season_from_date(dt),
                run_type = "marathon" if dist > 15 else "mid" if dist > 8 else "light" if dist > 6 else "jog",
                distance_km = dist, 
                avg_speed = speed,
                avg_elevation = elev,
                soreness_level = soreness,
                rushed = (i % 7 == 0),
            ))
        # Seed routes
        for r in [
            ("Lake Loop", 8.2, 120),
            ("Valley Glide", 7.3, 40),
            ("Summit Sprint", 10.5, 240),
            ("Riverside Out & Back", 6.8, 60)
        ]:
            db.add(Route(user_id = user_id, name = r[0], distance_km = r[1], elevation_gain = r[2]))

if __name__ == "__main__":
    seed()
    print("Seeded demo data.")