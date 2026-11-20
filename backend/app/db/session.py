from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from backend.app.core.config import settings
from backend.app.models.models import Base

# Using connect_args={"check_same_thread": False} for SQLite
engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {},
    pool_pre_ping=True
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    """Create all database tables."""
    Base.metadata.create_all(bind=engine)

def get_db():
    """FastAPI database session dependency."""
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()
