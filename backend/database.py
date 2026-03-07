"""
Database configuration and models for Wildlife Tracking System
"""
from sqlalchemy import Column, Float, Integer, String, Boolean, DateTime, JSON
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime

DATABASE_URL = "sqlite+aiosqlite:///./wildlife_tracking.db"

engine = create_async_engine(DATABASE_URL, echo=False)
async_session_maker = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
Base = declarative_base()


class Alert(Base):
    """Alert model for leopard sightings"""
    __tablename__ = "alerts"
    
    id = Column(Integer, primary_key=True, index=True)
    alert_id = Column(String, unique=True, index=True, nullable=False)
    timestamp = Column(String, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    source = Column(String, nullable=False)  # "Camera" or "Gallery"
    is_outside = Column(Boolean, default=False, nullable=False)
    distance_to_boundary_km = Column(Float, nullable=True)
    status = Column(String, default="active", nullable=False)  # "active" | "released"
    released_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Assessment(Base):
    """Health assessment model for leopards"""
    __tablename__ = "assessments"
    
    id = Column(Integer, primary_key=True, index=True)
    alert_id = Column(String, unique=True, index=True, nullable=False)
    severity = Column(String, nullable=False)
    score = Column(Integer, nullable=False)
    limping = Column(Boolean, default=False)
    visible_injury = Column(Boolean, default=False)
    abnormal_behavior = Column(Boolean, default=False)
    near_human_area = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)


async def init_db():
    """Initialize database tables"""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # Run migrations for existing databases (add new columns if missing)
    async with engine.begin() as conn:
        try:
            await conn.execute(
                __import__('sqlalchemy').text(
                    "ALTER TABLE alerts ADD COLUMN status TEXT DEFAULT 'active' NOT NULL"
                )
            )
        except Exception:
            pass  # Column already exists
        try:
            await conn.execute(
                __import__('sqlalchemy').text(
                    "ALTER TABLE alerts ADD COLUMN released_at DATETIME"
                )
            )
        except Exception:
            pass  # Column already exists


async def get_session() -> AsyncSession:
    """Get database session"""
    async with async_session_maker() as session:
        yield session