import os
import shutil
import uuid
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, status
from sqlalchemy.orm import Session
from backend.app.db.session import get_db
from backend.app.models.models import Detection, Drone, User
from backend.app.schemas.schemas import DetectionResponse, DetectionAnalysisResult
from backend.app.routers.auth import get_current_user
from backend.app.services.detection import run_ai_detection
from backend.app.core.config import settings

router = APIRouter(prefix="/detections", tags=["AI Vision Detection"])

@router.get("", response_model=list[DetectionResponse])
def list_detections(
    drone_id: Optional[str] = None,
    class_name: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List historical geo-referenced object detections."""
    q = db.query(Detection)
    if drone_id:
        q = q.filter(Detection.drone_id == drone_id)
    if class_name:
        q = q.filter(Detection.class_name == class_name.lower())
        
    return q.order_by(Detection.timestamp.desc()).offset(offset).limit(limit).all()

@router.get("/samples")
def get_sample_images(current_user: User = Depends(get_current_user)):
    """List bundled sample aerial images available for instant analysis."""
    sample_dir = os.path.join(settings.STORAGE_DIR, "aerial_images")
    os.makedirs(sample_dir, exist_ok=True)
    files = [f for f in os.listdir(sample_dir) if f.lower().endswith((".jpg", ".jpeg", ".png"))]
    return {
        "samples": [
            {
                "id": f,
                "name": f.replace("_", " ").replace(".jpg", "").title(),
                "path": f"/sample_data/aerial_images/{f}"
            }
            for f in files
        ]
    }

@router.post("/analyze", response_model=DetectionAnalysisResult)
async def analyze_aerial_image(
    drone_id: Optional[str] = Form(None),
    sample_filename: Optional[str] = Form(None),
    force_mock: bool = Form(False),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Execute AI object detection on uploaded or sample drone aerial image.
    Applies Ground Sampling Distance (GSD) model to geotag all detected objects to real-world GPS coordinates.
    """
    upload_dir = os.path.join(settings.STORAGE_DIR, "uploads")
    annotated_dir = os.path.join(settings.STORAGE_DIR, "annotated")
    os.makedirs(upload_dir, exist_ok=True)
    os.makedirs(annotated_dir, exist_ok=True)

    # 1. Resolve image source
    if sample_filename:
        src_path = os.path.join(settings.STORAGE_DIR, "aerial_images", sample_filename)
        if not os.path.exists(src_path):
            raise HTTPException(status_code=404, detail=f"Sample image '{sample_filename}' not found.")
        input_image_path = src_path
        filename_base = os.path.splitext(sample_filename)[0]
    elif file:
        ext = os.path.splitext(file.filename)[1] or ".jpg"
        unique_name = f"upload_{uuid.uuid4().hex[:8]}{ext}"
        input_image_path = os.path.join(upload_dir, unique_name)
        with open(input_image_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        filename_base = os.path.splitext(unique_name)[0]
    else:
        # Default to first sample image if none provided
        sample_dir = os.path.join(settings.STORAGE_DIR, "aerial_images")
        samples = [f for f in os.listdir(sample_dir) if f.lower().endswith((".jpg", ".png"))] if os.path.exists(sample_dir) else []
        if not samples:
            raise HTTPException(status_code=400, detail="No image file provided and no sample images available.")
        input_image_path = os.path.join(sample_dir, samples[0])
        filename_base = os.path.splitext(samples[0])[0]

    # 2. Get Drone position & telemetry context
    drone_lat = settings.HQ_LATITUDE
    drone_lon = settings.HQ_LONGITUDE
    drone_alt = 60.0
    drone_heading = 0.0

    if drone_id:
        drone = db.query(Drone).filter(Drone.id == drone_id).first()
        if drone:
            drone_lat = drone.latitude
            drone_lon = drone.longitude
            drone_alt = drone.altitude
            drone_heading = drone.heading

    # 3. Output paths
    output_annotated_name = f"annotated_{filename_base}_{uuid.uuid4().hex[:6]}.jpg"
    output_annotated_path = os.path.join(annotated_dir, output_annotated_name)

    # 4. Run AI Object Detection
    result = run_ai_detection(
        image_path=input_image_path,
        output_annotated_path=output_annotated_path,
        drone_lat=drone_lat,
        drone_lon=drone_lon,
        drone_alt=drone_alt,
        drone_heading=drone_heading,
        drone_id=drone_id,
        force_mock=force_mock
    )

    # 5. Persist detections to database
    now = datetime.now(timezone.utc)
    for det in result.detections:
        db_det = Detection(
            drone_id=drone_id,
            image_path=f"/sample_data/annotated/{output_annotated_name}",
            class_name=det.class_name,
            confidence=det.confidence,
            bbox_x1=det.bbox.x1,
            bbox_y1=det.bbox.y1,
            bbox_x2=det.bbox.x2,
            bbox_y2=det.bbox.y2,
            latitude=det.latitude,
            longitude=det.longitude,
            is_mock=result.is_mock,
            timestamp=now
        )
        db.add(db_det)
    db.commit()

    # Convert local absolute paths to web URLs for frontend
    result.image_url = f"/sample_data/uploads/{os.path.basename(input_image_path)}" if "uploads" in input_image_path else f"/sample_data/aerial_images/{os.path.basename(input_image_path)}"
    result.annotated_image_url = f"/sample_data/annotated/{output_annotated_name}"

    return result
