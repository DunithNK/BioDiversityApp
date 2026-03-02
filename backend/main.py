"""
FastAPI Backend for Wildlife Tracking System
Leopard Detection and Health Assessment API
"""
import os
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'

from fastapi import FastAPI, File, UploadFile, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from contextlib import asynccontextmanager

import tensorflow as tf
from tensorflow import keras
import numpy as np
from PIL import Image
import io
from pathlib import Path
from datetime import datetime

from database import init_db, get_session, Alert, Assessment

# ===================== Configuration =====================
APP_DIR = Path(__file__).parent
MODEL_PATH = APP_DIR / "models" / "leopard_detector.h5"
IMG_SIZE = 224
CONFIDENCE_THRESHOLD = 0.5

# ===================== Global Model =====================
model = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    global model
    
    print("=" * 60)
    print("🚀 Starting Wildlife Tracking API")
    print("=" * 60)
    
    # Initialize database
    print("📊 Initializing database...")
    await init_db()
    print("✅ Database ready")
    
    # Load model
    if MODEL_PATH.exists():
        print(f"🔍 Loading model from {MODEL_PATH}...")
        try:
            model = keras.models.load_model(MODEL_PATH)
            print("✅ Model loaded successfully")
            print(f"   Input shape: {model.input_shape}")
            print(f"   Output shape: {model.output_shape}")
        except Exception as e:
            print(f"❌ Error loading model: {e}")
            print("⚠️  Server will start but predictions will fail")
    else:
        print(f"⚠️  Model not found at {MODEL_PATH}")
        print("   Please train the model first using: python train_model.py")
    
    print("=" * 60)
    
    yield
    
    # Cleanup (if needed)
    print("\n🛑 Shutting down...")


# ===================== FastAPI App =====================
app = FastAPI(
    title="Wildlife Tracking API",
    description="Leopard Detection and Health Assessment System",
    version="1.0.0",
    lifespan=lifespan
)
# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ===================== Pydantic Models =====================
class AlertCreate(BaseModel):
    alert_id: str
    timestamp: str
    latitude: float
    longitude: float
    source: str


class AlertResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    alert_id: str
    timestamp: str
    latitude: float
    longitude: float
    source: str


class AssessmentCreate(BaseModel):
    alert_id: str
    severity: str
    score: int
    indicators: dict


class AssessmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    alert_id: str
    severity: str
    score: int
    limping: bool
    visible_injury: bool
    abnormal_behavior: bool
    near_human_area: bool


class PredictionResponse(BaseModel):
    result: str
    confidence: float
    model_loaded: bool


# ===================== Helper Functions =====================
def preprocess_image(image: Image.Image) -> np.ndarray:
    """Preprocess image for model prediction"""
    # Convert to RGB if necessary
    if image.mode != 'RGB':
        image = image.convert('RGB')
    
    # Resize
    image = image.resize((IMG_SIZE, IMG_SIZE))
    
    # Convert to array and normalize
    img_array = np.array(image) / 255.0
    
    # Add batch dimension
    img_array = np.expand_dims(img_array, axis=0)
    
    return img_array


async def predict_leopard(image: Image.Image) -> dict:
    """Predict if image contains a leopard"""
    if model is None:
        raise HTTPException(
            status_code=503,
            detail="Model not loaded. Please train the model first."
        )
    
    try:
        # Preprocess
        img_array = preprocess_image(image)
        
        # Predict
        prediction = model.predict(img_array, verbose=0)[0][0]
        
        # Interpretation (1 = not_leopard, 0 = leopard in some datasets)
        # Check model's class indices during training
        is_leopard = prediction < 0.5
        confidence = float(1 - prediction if is_leopard else prediction)
        
        result = "Leopard Detected" if is_leopard and confidence >= CONFIDENCE_THRESHOLD else "No Leopard Detected"
        
        return {
            "result": result,
            "confidence": confidence,
            "model_loaded": True
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")


# ===================== API Endpoints =====================

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Wildlife Tracking API",
        "version": "1.0.0",
        "status": "running",
        "model_loaded": model is not None
    }


@app.post("/predict", response_model=PredictionResponse)
async def predict_image(file: UploadFile = File(...)):
    """
    Predict if uploaded image contains a leopard
    """
    # Validate file type
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    try:
        # Read image
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        
        # Predict
        result = await predict_leopard(image)
        
        return result
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")


@app.get("/alerts", response_model=List[AlertResponse])
async def get_alerts(session: AsyncSession = Depends(get_session)):
    """
    Get all alerts
    """
    try:
        result = await session.execute(select(Alert).order_by(Alert.created_at.desc()))
        alerts = result.scalars().all()
        return alerts
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@app.post("/alert")
async def create_alert(alert: AlertCreate, session: AsyncSession = Depends(get_session)):
    """
    Create new alert
    """
    try:
        # Check if alert already exists
        result = await session.execute(
            select(Alert).where(Alert.alert_id == alert.alert_id)
        )
        existing = result.scalar_one_or_none()
        
        if existing:
            return {"message": "Alert already exists", "alert_id": alert.alert_id}
        
        # Create new alert
        new_alert = Alert(
            alert_id=alert.alert_id,
            timestamp=alert.timestamp,
            latitude=alert.latitude,
            longitude=alert.longitude,
            source=alert.source
        )
        
        session.add(new_alert)
        await session.commit()
        await session.refresh(new_alert)
        
        return {"message": "Alert created successfully", "alert_id": new_alert.alert_id}
    
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@app.post("/assessment")
async def create_assessment(
    assessment: AssessmentCreate,
    session: AsyncSession = Depends(get_session)
):
    """
    Create health assessment
    """
    try:
        # Check if assessment already exists
        result = await session.execute(
            select(Assessment).where(Assessment.alert_id == assessment.alert_id)
        )
        existing = result.scalar_one_or_none()
        
        if existing:
            # Update existing
            existing.severity = assessment.severity
            existing.score = assessment.score
            existing.limping = assessment.indicators.get('limping', False)
            existing.visible_injury = assessment.indicators.get('visible_injury', False)
            existing.abnormal_behavior = assessment.indicators.get('abnormal_behavior', False)
            existing.near_human_area = assessment.indicators.get('near_human_area', False)
            
            await session.commit()
            return {"message": "Assessment updated", "alert_id": assessment.alert_id}
        
        # Create new assessment
        new_assessment = Assessment(
            alert_id=assessment.alert_id,
            severity=assessment.severity,
            score=assessment.score,
            limping=assessment.indicators.get('limping', False),
            visible_injury=assessment.indicators.get('visible_injury', False),
            abnormal_behavior=assessment.indicators.get('abnormal_behavior', False),
            near_human_area=assessment.indicators.get('near_human_area', False)
        )
        
        session.add(new_assessment)
        await session.commit()
        await session.refresh(new_assessment)
        
        return {"message": "Assessment created", "alert_id": new_assessment.alert_id}
    
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@app.get("/assessment/{alert_id}", response_model=AssessmentResponse)
async def get_assessment(alert_id: str, session: AsyncSession = Depends(get_session)):
    """
    Get assessment by alert ID
    """
    try:
        result = await session.execute(
            select(Assessment).where(Assessment.alert_id == alert_id)
        )
        assessment = result.scalar_one_or_none()
        
        if not assessment:
            raise HTTPException(status_code=404, detail="Assessment not found")
        
        return assessment
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@app.get("/health")
async def health_check():
    """
    Health check endpoint
    """
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "model_loaded": model is not None,
        "database": "connected"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
