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

from database import init_db, get_session, Alert, Assessment, CaptureStatus
from geofence import is_inside_gal_oya, get_location_status, validate_coordinates

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
    is_outside: bool = False
    distance_to_boundary_km: Optional[float] = None


class AlertResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    alert_id: str
    timestamp: str
    latitude: float
    longitude: float
    source: str
    is_outside: bool
    distance_to_boundary_km: Optional[float] = None


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


class CaptureUpdate(BaseModel):
    is_captured: bool
    capture_timestamp: str
    capture_notes: Optional[str] = None


class ReleaseUpdate(BaseModel):
    is_released: bool
    release_timestamp: str
    release_notes: Optional[str] = None


class CaptureStatusResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    alert_id: str
    is_captured: bool
    capture_timestamp: Optional[str] = None
    is_released: bool
    release_timestamp: Optional[str] = None


class CapturedLeopardResponse(BaseModel):
    alert_id: str
    timestamp: str
    source: str
    latitude: float
    longitude: float
    capture_timestamp: str
    is_released: bool
    release_timestamp: Optional[str] = None
    severity: Optional[str] = None
    score: Optional[int] = None


class PredictionResponse(BaseModel):
    model_config = ConfigDict(protected_namespaces=())
    
    result: str
    confidence: float
    model_loaded: bool
    geofence_status: Optional[dict] = None


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
            source=alert.source,
            is_outside=alert.is_outside,
            distance_to_boundary_km=alert.distance_to_boundary_km
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


# ===================== CAPTURE & RELEASE ENDPOINTS =====================

@app.post("/capture/{alert_id}")
async def confirm_capture(
    alert_id: str,
    update: CaptureUpdate,
    session: AsyncSession = Depends(get_session)
):
    """
    Mark a leopard as captured
    """
    try:
        # Verify alert exists
        result = await session.execute(
            select(Alert).where(Alert.alert_id == alert_id)
        )
        alert = result.scalar_one_or_none()
        
        if not alert:
            raise HTTPException(status_code=404, detail="Alert not found")
        
        # Check if capture status already exists
        result = await session.execute(
            select(CaptureStatus).where(CaptureStatus.alert_id == alert_id)
        )
        existing = result.scalar_one_or_none()
        
        if existing:
            # Update existing
            existing.is_captured = update.is_captured
            existing.capture_timestamp = update.capture_timestamp
            if update.capture_notes:
                existing.capture_notes = update.capture_notes
            existing.updated_at = datetime.utcnow()
        else:
            # Create new
            new_status = CaptureStatus(
                alert_id=alert_id,
                is_captured=update.is_captured,
                capture_timestamp=update.capture_timestamp,
                capture_notes=update.capture_notes
            )
            session.add(new_status)
        
        await session.commit()
        
        print(f"✅ Leopard {alert_id} marked as captured at {update.capture_timestamp}")
        
        return {
            "status": "success",
            "message": "Leopard marked as captured",
            "alert_id": alert_id
        }
    
    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@app.post("/release/{alert_id}")
async def confirm_release(
    alert_id: str,
    update: ReleaseUpdate,
    session: AsyncSession = Depends(get_session)
):
    """
    Mark a captured leopard as released
    """
    try:
        # Get capture status
        result = await session.execute(
            select(CaptureStatus).where(CaptureStatus.alert_id == alert_id)
        )
        capture_status = result.scalar_one_or_none()
        
        if not capture_status:
            raise HTTPException(
                status_code=404,
                detail="Leopard not found in capture records"
            )
        
        if not capture_status.is_captured:
            raise HTTPException(
                status_code=400,
                detail="Leopard is not marked as captured"
            )
        
        # Update release status
        capture_status.is_released = update.is_released
        capture_status.release_timestamp = update.release_timestamp
        if update.release_notes:
            capture_status.release_notes = update.release_notes
        capture_status.updated_at = datetime.utcnow()
        
        await session.commit()
        
        print(f"✅ Leopard {alert_id} marked as released at {update.release_timestamp}")
        
        return {
            "status": "success",
            "message": "Leopard marked as released",
            "alert_id": alert_id
        }
    
    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@app.get("/capture-status/{alert_id}", response_model=CaptureStatusResponse)
async def get_capture_status(
    alert_id: str,
    session: AsyncSession = Depends(get_session)
):
    """
    Get capture/release status for a specific alert
    """
    try:
        # Verify alert exists
        result = await session.execute(
            select(Alert).where(Alert.alert_id == alert_id)
        )
        alert = result.scalar_one_or_none()
        
        if not alert:
            raise HTTPException(status_code=404, detail="Alert not found")
        
        # Get capture status
        result = await session.execute(
            select(CaptureStatus).where(CaptureStatus.alert_id == alert_id)
        )
        status = result.scalar_one_or_none()
        
        if not status:
            # Return default status
            return CaptureStatusResponse(
                alert_id=alert_id,
                is_captured=False,
                is_released=False
            )
        
        return status
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@app.get("/captured-leopards", response_model=List[CapturedLeopardResponse])
async def get_captured_leopards(session: AsyncSession = Depends(get_session)):
    """
    Get all captured leopards (both in care and released)
    """
    try:
        # Get all captured statuses
        result = await session.execute(
            select(CaptureStatus)
            .where(CaptureStatus.is_captured == True)
            .order_by(CaptureStatus.is_released, CaptureStatus.capture_timestamp.desc())
        )
        captured_statuses = result.scalars().all()
        
        captured_leopards = []
        
        for status in captured_statuses:
            # Get alert data
            alert_result = await session.execute(
                select(Alert).where(Alert.alert_id == status.alert_id)
            )
            alert = alert_result.scalar_one_or_none()
            
            if not alert:
                continue
            
            # Get assessment data if available
            assessment_result = await session.execute(
                select(Assessment).where(Assessment.alert_id == status.alert_id)
            )
            assessment = assessment_result.scalar_one_or_none()
            
            leopard_info = CapturedLeopardResponse(
                alert_id=status.alert_id,
                timestamp=alert.timestamp,
                source=alert.source,
                latitude=alert.latitude,
                longitude=alert.longitude,
                capture_timestamp=status.capture_timestamp,
                is_released=status.is_released,
                release_timestamp=status.release_timestamp,
                severity=assessment.severity if assessment else None,
                score=assessment.score if assessment else None
            )
            
            captured_leopards.append(leopard_info)
        
        print(f"📊 Found {len(captured_leopards)} captured leopards")
        
        return captured_leopards
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@app.get("/captured-leopards/in-care", response_model=List[CapturedLeopardResponse])
async def get_leopards_in_care(session: AsyncSession = Depends(get_session)):
    """
    Get only leopards currently in care (not released)
    """
    try:
        result = await session.execute(
            select(CaptureStatus)
            .where(CaptureStatus.is_captured == True)
            .where(CaptureStatus.is_released == False)
            .order_by(CaptureStatus.capture_timestamp.desc())
        )
        statuses = result.scalars().all()
        
        in_care = []
        
        for status in statuses:
            alert_result = await session.execute(
                select(Alert).where(Alert.alert_id == status.alert_id)
            )
            alert = alert_result.scalar_one_or_none()
            
            if not alert:
                continue
            
            assessment_result = await session.execute(
                select(Assessment).where(Assessment.alert_id == status.alert_id)
            )
            assessment = assessment_result.scalar_one_or_none()
            
            leopard_info = CapturedLeopardResponse(
                alert_id=status.alert_id,
                timestamp=alert.timestamp,
                source=alert.source,
                latitude=alert.latitude,
                longitude=alert.longitude,
                capture_timestamp=status.capture_timestamp,
                is_released=False,
                release_timestamp=None,
                severity=assessment.severity if assessment else None,
                score=assessment.score if assessment else None
            )
            
            in_care.append(leopard_info)
        
        print(f"📊 Found {len(in_care)} leopards in care")
        
        return in_care
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@app.get("/captured-leopards/released", response_model=List[CapturedLeopardResponse])
async def get_released_leopards(session: AsyncSession = Depends(get_session)):
    """
    Get only released leopards
    """
    try:
        result = await session.execute(
            select(CaptureStatus)
            .where(CaptureStatus.is_captured == True)
            .where(CaptureStatus.is_released == True)
            .order_by(CaptureStatus.release_timestamp.desc())
        )
        statuses = result.scalars().all()
        
        released = []
        
        for status in statuses:
            alert_result = await session.execute(
                select(Alert).where(Alert.alert_id == status.alert_id)
            )
            alert = alert_result.scalar_one_or_none()
            
            if not alert:
                continue
            
            assessment_result = await session.execute(
                select(Assessment).where(Assessment.alert_id == status.alert_id)
            )
            assessment = assessment_result.scalar_one_or_none()
            
            leopard_info = CapturedLeopardResponse(
                alert_id=status.alert_id,
                timestamp=alert.timestamp,
                source=alert.source,
                latitude=alert.latitude,
                longitude=alert.longitude,
                capture_timestamp=status.capture_timestamp,
                is_released=True,
                release_timestamp=status.release_timestamp,
                severity=assessment.severity if assessment else None,
                score=assessment.score if assessment else None
            )
            
            released.append(leopard_info)
        
        print(f"📊 Found {len(released)} released leopards")
        
        return released
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


# ===================== STATISTICS ENDPOINT =====================

@app.get("/stats")
async def get_statistics(session: AsyncSession = Depends(get_session)):
    """
    Get overall statistics
    """
    try:
        # Total alerts
        alerts_result = await session.execute(select(Alert))
        total_alerts = len(alerts_result.scalars().all())
        
        # Captured leopards
        captured_result = await session.execute(
            select(CaptureStatus).where(CaptureStatus.is_captured == True)
        )
        captured_statuses = captured_result.scalars().all()
        total_captured = len(captured_statuses)
        
        in_care = sum(1 for s in captured_statuses if not s.is_released)
        released = sum(1 for s in captured_statuses if s.is_released)
        
        # Severity breakdown
        assessments_result = await session.execute(select(Assessment))
        assessments = assessments_result.scalars().all()
        
        severity_counts = {
            "None": 0,
            "Low": 0,
            "Moderate": 0,
            "High": 0,
            "Critical": 0
        }
        
        for assessment in assessments:
            if assessment.severity in severity_counts:
                severity_counts[assessment.severity] += 1
        
        return {
            "total_alerts": total_alerts,
            "total_captured": total_captured,
            "in_care": in_care,
            "released": released,
            "not_captured": total_alerts - total_captured,
            "severity_breakdown": severity_counts
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


# ===================== LOCATION & HEALTH CHECK =====================

@app.post("/check-location")
async def check_location(latitude: float, longitude: float):
    """
    Check if coordinates are inside Gal Oya National Park boundary
    Returns location status for frontend validation
    """
    try:
        # Validate coordinates
        is_valid, msg = validate_coordinates(latitude, longitude)
        if not is_valid:
            raise HTTPException(status_code=400, detail=msg)
        
        # Get location status
        location_status = get_location_status(latitude, longitude)
        
        return {
            "valid": is_valid,
            "is_inside": location_status["is_inside"],
            "location": location_status["location"],
            "distance_to_boundary_km": location_status["distance_to_boundary_km"],
            "park_name": location_status["park_name"],
            "coordinates": location_status["coordinates"],
            "message": "Location is inside Gal Oya National Park" if location_status["is_inside"] 
                      else f"Location is {location_status['distance_to_boundary_km']} km from Gal Oya boundary"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Location check error: {str(e)}")


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