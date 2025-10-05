from .database import engine, Base, session_scope
from .models import User, Run, Route
from .utils import season_from_date
from datetime import datetime, timedelta
import random

def seed():
    Base.metadata.create_all(engine)
    user_id = "demo"