from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel, Field

# --- Auth Schemas ---
class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    full_name: str
    role: str
    is_active: bool

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class TokenPayload(BaseModel):
    sub: str
    role: str
    exp: int

# --- Drone Schemas ---
class DroneCommand(BaseModel):
    command: str  # "return_to_base", "pause", "resume", "goto", "assign_route"
    target_latitude: Optional[float] = None
    target_longitude: Optional[float] = None
    route: Optional[list[list[float]]] = None  # [[lat, lon], ...]
    speed: Optional[float] = None

class DroneCreate(BaseModel):
    id: str
    name: str
    model: str = "DJI Matrice 350 RTK"
    serial_number: str
    latitude: float
    longitude: float
    altitude: float = 50.0

class DroneUpdate(BaseModel):
    name: Optional[str] = None
    status: Optional[str] = None
    speed: Optional[float] = None
    altitude: Optional[float] = None

class DroneResponse(BaseModel):
    id: str
    name: str
    model: str
    serial_number: str
    status: str
    latitude: float
    longitude: float
    altitude: float
    speed: float
    heading: float
    battery: float
    signal_strength: int
    current_mission_id: Optional[int] = None
    updated_at: datetime

    class Config:
        from_attributes = True

# --- Telemetry Schemas ---
class TelemetryResponse(BaseModel):
    id: int
    drone_id: str
    timestamp: datetime
    latitude: float
    longitude: float
    altitude: float
    speed: float
    heading: float
    battery: float
    signal_strength: int
    status: str

    class Config:
        from_attributes = True

# --- Geofence Schemas ---
class GeofenceCreate(BaseModel):
    name: str
    zone_type: str  # "restricted", "patrol", "safe"
    description: Optional[str] = ""
    coordinates: list[list[float]]  # [[lat, lon], [lat, lon], ...]
    min_altitude: float = 0.0
    max_altitude: float = 500.0
    is_active: bool = True

class GeofenceResponse(BaseModel):
    id: int
    name: str
    zone_type: str
    description: Optional[str]
    coordinates: list[list[float]]
    min_altitude: float
    max_altitude: float
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

# --- Alert Schemas ---
class AlertResponse(BaseModel):
    id: int
    drone_id: Optional[str]
    alert_type: str
    severity: str
    message: str
    latitude: Optional[float]
    longitude: Optional[float]
    status: str
    created_at: datetime
    resolved_at: Optional[datetime]
    acknowledged_by: Optional[str]

    class Config:
        from_attributes = True

class AlertAckRequest(BaseModel):
    acknowledged_by: Optional[str] = "Operator"

# --- Detection Schemas ---
class BoundingBox(BaseModel):
    x1: float
    y1: float
    x2: float
    y2: float

class DetectionItem(BaseModel):
    class_name: str
    confidence: float
    bbox: BoundingBox
    latitude: float
    longitude: float

class DetectionAnalysisResult(BaseModel):
    image_url: str
    annotated_image_url: str
    is_mock: bool
    processing_time_ms: float
    detections: list[DetectionItem]
    counts_by_class: dict[str, int]
    drone_id: Optional[str] = None
    drone_position: Optional[dict[str, float]] = None

class DetectionResponse(BaseModel):
    id: int
    drone_id: Optional[str]
    image_path: str
    class_name: str
    confidence: float
    bbox_x1: float
    bbox_y1: float
    bbox_x2: float
    bbox_y2: float
    latitude: float
    longitude: float
    is_mock: bool
    timestamp: datetime

    class Config:
        from_attributes = True

# --- Mission Schemas ---
class MissionPlanRequest(BaseModel):
    name: str = "Survey Mission"
    polygon: list[list[float]]  # [[lat, lon], ...]
    altitude: float = Field(default=60.0, ge=15.0, le=200.0)
    overlap_percentage: float = Field(default=70.0, ge=20.0, le=90.0)

class MissionWaypointItem(BaseModel):
    sequence: int
    latitude: float
    longitude: float
    altitude: float
    action: str = "fly_through"

class MissionPlanResponse(BaseModel):
    name: str
    boundary_polygon: list[list[float]]
    target_altitude: float
    overlap_percentage: float
    estimated_distance_km: float
    estimated_duration_minutes: float
    estimated_battery_cost: float
    area_km2: float
    waypoints: list[MissionWaypointItem]

class MissionAssignRequest(BaseModel):
    drone_id: str

class MissionResponse(BaseModel):
    id: int
    name: str
    drone_id: Optional[str]
    mission_type: str
    status: str
    target_altitude: float
    overlap_percentage: float
    estimated_distance_km: float
    estimated_duration_minutes: float
    estimated_battery_cost: float
    area_km2: float
    boundary_polygon: list[list[float]]
    created_at: datetime
    waypoints: list[MissionWaypointItem] = []

    class Config:
        from_attributes = True

# --- Analytics Schemas ---
class AnalyticsSummary(BaseModel):
    total_drones: int
    drones_active: int
    drones_returning: int
    drones_offline: int
    total_alerts: int
    active_alerts: int
    critical_alerts: int
    total_detections: int
    detections_today: int
    total_area_covered_km2: float
    detections_by_class: dict[str, int]
    alerts_by_severity: dict[str, int]
    detections_timeline: list[dict[str, Any]]
    fleet_battery_status: list[dict[str, Any]]
