"""
PromptOps AI — Database Setup
------------------------------
Handles the PostgreSQL connection (Neon) and table definitions.
Separated from main.py to keep API logic and data concerns distinct.
"""

import os
from datetime import datetime
from dotenv import load_dotenv
from sqlalchemy import Column, DateTime, Float, Integer, String, Text, create_engine, inspect, text
from sqlalchemy.orm import declarative_base, sessionmaker

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

engine = (
    create_engine(
        DATABASE_URL,
        pool_pre_ping=True,
        pool_recycle=300,
    )
    if DATABASE_URL
    else None
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine) if engine else None
Base = declarative_base()


class PromptLibraryEntry(Base):
    __tablename__ = "prompt_library"

    id = Column(Integer, primary_key=True, index=True)
    category = Column(String, nullable=False, index=True)
    title = Column(String, nullable=False)
    prompt = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class User(Base):
    """User model for tracking user-specific data."""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, nullable=False, unique=True, index=True)
    email = Column(String, nullable=True, unique=True, index=True)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class PromptVersion(Base):
    __tablename__ = "prompt_versions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    name = Column(String, nullable=False, index=True)
    prompt = Column(Text, nullable=False)
    score = Column(Float, nullable=True)       # optional cached eval score
    created_at = Column(DateTime, default=datetime.utcnow)


class ActivityLog(Base):
    """Persistent activity log so the dashboard shows real history."""
    __tablename__ = "activity_log"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    action = Column(String, nullable=False)   # e.g. "evaluate", "optimize", "save_version"
    label = Column(String, nullable=False)    # human-readable description
    created_at = Column(DateTime, default=datetime.utcnow)


class UserCounters(Base):
    """Tracks user-specific statistics."""
    __tablename__ = "user_counters"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, unique=True, index=True)
    evaluate_calls = Column(Integer, default=0)
    optimize_calls = Column(Integer, default=0)
    total_score_sum = Column(Float, default=0.0)
    scores_recorded = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)



def get_db():
    """
    Yields a per-request database session that is always closed afterward.
    Used as a FastAPI dependency.
    """
    if SessionLocal is None:
        raise RuntimeError("Database is not configured. Set DATABASE_URL in your .env file.")
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """
    Creates all tables on startup if they don't exist yet.
    Safe to call every time — won't drop existing data.
    """
    if not engine:
        return

    Base.metadata.create_all(bind=engine)

    inspector = inspect(engine)
    if "users" in inspector.get_table_names():
        columns = {column["name"] for column in inspector.get_columns("users")}
        if "hashed_password" not in columns:
            with engine.begin() as conn:
                conn.execute(text("ALTER TABLE users ADD COLUMN hashed_password VARCHAR"))