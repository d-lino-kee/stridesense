from datetime import datetime

def season_from_date(dt: datetime):
    m = dt.month
    if m in [12, 1, 2]:
        return "winter"
    if m in [3, 4, 5]:
        return "spring"
    if m in [6, 7, 8]:
        return "summer"
    if m in [9, 10, 11]:
        return "fall"