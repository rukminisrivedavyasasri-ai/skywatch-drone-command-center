import os
import time
import math
from typing import Optional, Tuple
from PIL import Image, ImageDraw, ImageFont
from backend.app.schemas.schemas import BoundingBox, DetectionItem, DetectionAnalysisResult

# Try loading YOLOv8n, fallback to mock mode if unavailable
YOLO_MODEL = None
MOCK_MODE_ACTIVE = False

try:
    from ultralytics import YOLO
    try:
        # Load lightweight YOLOv8n model
        YOLO_MODEL = YOLO("yolov8n.pt")
        print("[AI] Ultralytics YOLOv8n model loaded successfully.")
    except Exception as model_err:
        print(f"[AI] YOLOv8n failed to load weight file ({model_err}). Defaulting to MOCK MODE.")
        MOCK_MODE_ACTIVE = True
except ImportError:
    print("[AI] Ultralytics package not available. Defaulting to MOCK MODE.")
    MOCK_MODE_ACTIVE = True

def pixel_to_latlon(
    pixel_x: float,
    pixel_y: float,
    img_width: int,
    img_height: int,
    drone_lat: float,
    drone_lon: float,
    drone_alt: float = 60.0,
    drone_heading: float = 0.0,
    camera_fov_deg: float = 60.0
) -> Tuple[float, float]:
    """
    Project 2D camera pixel coordinates (u, v) into real-world geographic (lat, lon)
    using drone position, altitude, heading, and Ground Sampling Distance (GSD) projective geometry.
    """
    # Optical center
    cx = img_width / 2.0
    cy = img_height / 2.0
    
    # Ground Sampling Distance (meters per pixel)
    fov_rad = math.radians(camera_fov_deg)
    ground_width_m = 2.0 * drone_alt * math.tan(fov_rad / 2.0)
    gsd = ground_width_m / max(img_width, 1)
    
    # Offset in camera sensor coordinate frame (x: right, y: forward)
    delta_x_cam = (pixel_x - cx) * gsd
    delta_y_cam = -(pixel_y - cy) * gsd  # Top of image is forward
    
    # Rotate by drone heading (heading in degrees from North, clockwise)
    heading_rad = math.radians(drone_heading)
    delta_north = delta_y_cam * math.cos(heading_rad) - delta_x_cam * math.sin(heading_rad)
    delta_east = delta_y_cam * math.sin(heading_rad) + delta_x_cam * math.cos(heading_rad)
    
    # Convert meters to degrees lat/lon
    lat_deg_per_m = 1.0 / 111139.0
    lon_deg_per_m = 1.0 / (111139.0 * math.cos(math.radians(drone_lat)))
    
    target_lat = drone_lat + (delta_north * lat_deg_per_m)
    target_lon = drone_lon + (delta_east * lon_deg_per_m)
    
    return round(target_lat, 6), round(target_lon, 6)

def run_ai_detection(
    image_path: str,
    output_annotated_path: str,
    drone_lat: float = 17.385044,
    drone_lon: float = 78.486671,
    drone_alt: float = 60.0,
    drone_heading: float = 0.0,
    drone_id: Optional[str] = None,
    force_mock: bool = False
) -> DetectionAnalysisResult:
    """
    Execute AI object detection on an aerial image.
    Uses YOLOv8n if available; otherwise operates in intelligent deterministic MOCK MODE.
    """
    start_time = time.time()
    
    # Ensure source image exists
    if not os.path.exists(image_path):
        raise FileNotFoundError(f"Image not found at: {image_path}")
        
    with Image.open(image_path) as img:
        img_w, img_h = img.size
        # Work on RGB copy for annotations
        annotated_img = img.convert("RGB")

    detections: list[DetectionItem] = []
    use_mock = force_mock or MOCK_MODE_ACTIVE or (YOLO_MODEL is None)
    
    if not use_mock:
        try:
            results = YOLO_MODEL(image_path, conf=0.35, verbose=False)
            res = results[0]
            boxes = res.boxes
            draw = ImageDraw.Draw(annotated_img)
            
            for b in boxes:
                xyxy = b.xyxy[0].tolist()
                conf = float(b.conf[0])
                cls_id = int(b.cls[0])
                cls_name = YOLO_MODEL.names[cls_id]
                
                # Only keep drone surveillance relevant classes
                relevant_classes = {"person", "car", "truck", "bus", "motorcycle", "boat", "airplane"}
                if cls_name not in relevant_classes and len(relevant_classes) > 0:
                    continue
                    
                x1, y1, x2, y2 = xyxy
                center_x = (x1 + x2) / 2.0
                center_y = (y1 + y2) / 2.0
                
                lat, lon = pixel_to_latlon(
                    center_x, center_y, img_w, img_h,
                    drone_lat, drone_lon, drone_alt, drone_heading
                )
                
                bbox = BoundingBox(x1=round(x1, 1), y1=round(y1, 1), x2=round(x2, 1), y2=round(y2, 1))
                detections.append(
                    DetectionItem(
                        class_name=cls_name,
                        confidence=round(conf, 2),
                        bbox=bbox,
                        latitude=lat,
                        longitude=lon
                    )
                )
                # Draw sleek neon box
                box_color = "#EF4444" if cls_name in ["truck", "boat"] else "#22D3EE"
                draw.rectangle([x1, y1, x2, y2], outline=box_color, width=3)
                label_text = f"{cls_name.upper()} {int(conf * 100)}%"
                draw.rectangle([x1, max(0, y1 - 18), x1 + 100, y1], fill=box_color)
                draw.text((x1 + 4, max(0, y1 - 16)), label_text, fill="#0B1220")
                
        except Exception as detection_err:
            print(f"[AI] YOLO execution failed ({detection_err}). Falling back to Mock Mode.")
            use_mock = True

    if use_mock:
        # Realistic Mock Mode with tactical bounding boxes
        draw = ImageDraw.Draw(annotated_img)
        
        # Deterministic mock detections based on image aspect ratio
        mock_candidates = [
            {"class": "car", "conf": 0.94, "box": [0.15, 0.25, 0.32, 0.45], "color": "#22D3EE"},
            {"class": "truck", "conf": 0.89, "box": [0.45, 0.30, 0.68, 0.58], "color": "#F59E0B"},
            {"class": "person", "conf": 0.87, "box": [0.38, 0.65, 0.44, 0.75], "color": "#22C55E"},
            {"class": "person", "conf": 0.82, "box": [0.72, 0.20, 0.78, 0.30], "color": "#22C55E"},
            {"class": "vehicle", "conf": 0.91, "box": [0.65, 0.60, 0.85, 0.82], "color": "#22D3EE"}
        ]
        
        detections = []
        for cand in mock_candidates:
            rel_x1, rel_y1, rel_x2, rel_y2 = cand["box"]
            x1 = rel_x1 * img_w
            y1 = rel_y1 * img_h
            x2 = rel_x2 * img_w
            y2 = rel_y2 * img_h
            
            center_x = (x1 + x2) / 2.0
            center_y = (y1 + y2) / 2.0
            
            lat, lon = pixel_to_latlon(
                center_x, center_y, img_w, img_h,
                drone_lat, drone_lon, drone_alt, drone_heading
            )
            
            bbox = BoundingBox(x1=round(x1, 1), y1=round(y1, 1), x2=round(x2, 1), y2=round(y2, 1))
            detections.append(
                DetectionItem(
                    class_name=cand["class"],
                    confidence=cand["conf"],
                    bbox=bbox,
                    latitude=lat,
                    longitude=lon
                )
            )
            
            color = cand["color"]
            draw.rectangle([x1, y1, x2, y2], outline=color, width=3)
            label = f"{cand['class'].upper()} {int(cand['conf'] * 100)}%"
            draw.rectangle([x1, max(0, y1 - 20), x1 + 110, y1], fill=color)
            draw.text((x1 + 4, max(0, y1 - 18)), label, fill="#0B1220")

    # Save annotated image
    os.makedirs(os.path.dirname(output_annotated_path), exist_ok=True)
    annotated_img.save(output_annotated_path, "JPEG", quality=90)
    
    elapsed_ms = round((time.time() - start_time) * 1000.0, 1)
    
    # Counts by class
    counts: dict[str, int] = {}
    for d in detections:
        counts[d.class_name] = counts.get(d.class_name, 0) + 1

    return DetectionAnalysisResult(
        image_url=image_path,
        annotated_image_url=output_annotated_path,
        is_mock=use_mock,
        processing_time_ms=elapsed_ms,
        detections=detections,
        counts_by_class=counts,
        drone_id=drone_id,
        drone_position={"latitude": drone_lat, "longitude": drone_lon, "altitude": drone_alt, "heading": drone_heading}
    )
