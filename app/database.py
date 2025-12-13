from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from .config import settings

engine = create_engine(settings.DATABASE_URL, echo=False, future=True)
sessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

class Base(DeclarativeBase):
    pass

# Dependency
fron contextlib import contextmanager


@contextmanager
def session_scope():
    db = sessionLocal()
    try: 
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()