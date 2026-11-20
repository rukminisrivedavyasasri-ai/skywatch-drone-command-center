from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=False)
    role = Column(String(20), default="OPERATOR", nullable=False)  # ADMIN or OPERATOR
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class Drone(Base):
    __tablename__ = "drones"
    
    id = Column(String(50), primary_key=True, index=True)  # e.g. "DRONE-01"
    name = Column(String(100), nullable=False)
    model = Column(String(100), default="DJI Matrice 350 RTK")
    serial_number = Column(String(100), unique=True, nullable=False)
    status = Column(String(30), default="active")  # active, returning, low_battery, offline, emergency
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    altitude = Column(Float, default=50.0)  # meters
    speed = Column(Float, default=10.0)     # m/s
    heading = Column(Float, default=0.0)    # degrees (0-360)
    battery = Column(Float, default=100.0)  # percentage (0-100)
    signal_strength = Column(Integer, default=95)  # percentage (0-100)
    current_mission_id = Column(Integer, ForeignKey("missions.id", ondelete="SET NULL"), nullable=True)
    assigned_route = Column(Text, nullable=True)  # JSON string of waypoints
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    telemetry = relationship("TelemetrySample", back_populates="drone", cascade="all, delete-orphan")

class TelemetrySample(Base):
    __tablename__ = "telemetry_samples"
    
    id = Column(Integer, primary_key=True, index=True)
    drone_id = Column(String(50), ForeignKey("drones.id", ondelete="CASCADE"), nullable=False)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    altitude = Column(Float, nullable=False)
    speed = Column(Float, nullable=False)
    heading = Column(Float, nullable=False)
    battery = Column(Float, nullable=False)
    signal_strength = Column(Integer, nullable=False)
    status = Column(String(30), nullable=False)
    
    drone = relationship("Drone", back_populates="telemetry")

class Geofence(Base):
    __tablename__ = "geofences"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    zone_type = Column(String(30), nullable=False)  # "restricted" (red), "patrol" (blue), "safe" (green)
    description = Column(String(255), default="")
    coordinates = Column(Text, nullable=False)  # JSON array of [lat, lon] tuples
    min_altitude = Column(Float, default=0.0)
    max_altitude = Column(Float, default=500.0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class Alert(Base):
    __tablename__ = "alerts"
    
    id = Column(Integer, primary_key=True, index=True)
    drone_id = Column(String(50), nullable=True)
    alert_type = Column(String(50), nullable=False)  # geofence_breach, low_battery, signal_loss, detection_anomaly, speed_violation, altitude_violation
    severity = Column(String(20), nullable=False)    # info, warning, critical
    message = Column(Text, nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    status = Column(String(20), default="active")    # active, acknowledged, resolved
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    resolved_at = Column(DateTime, nullable=True)
    acknowledged_by = Column(String(50), nullable=True)

class Detection(Base):
    __tablename__ = "detections"
    
    id = Column(Integer, primary_key=True, index=True)
    drone_id = Column(String(50), nullable=True)
    image_path = Column(String(255), nullable=False)
    class_name = Column(String(50), nullable=False)
    confidence = Column(Float, nullable=False)
    bbox_x1 = Column(Float, nullable=False)
    bbox_y1 = Column(Float, nullable=False)
    bbox_x2 = Column(Float, nullable=False)
    bbox_y2 = Column(Float, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    is_mock = Column(Boolean, default=False)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)

class Mission(Base):
    __tablename__ = "missions"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    drone_id = Column(String(50), nullable=True)
    mission_type = Column(String(50), default="survey_lawnmower")
    status = Column(String(30), default="planned")  # planned, assigned, in_progress, completed, cancelled
    target_altitude = Column(Float, default=60.0)
    overlap_percentage = Column(Float, default=70.0)
    estimated_distance_km = Column(Float, default=0.0)
    estimated_duration_minutes = Column(Float, default=0.0)
    estimated_battery_cost = Column(Float, default=0.0)
    area_km2 = Column(Float, default=0.0)
    boundary_polygon = Column(Text, nullable=False)  # JSON array of [lat, lon]
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    
    waypoints = relationship("MissionWaypoint", back_populates="mission", cascade="all, delete-orphan", order_by="MissionWaypoint.sequence")

class MissionWaypoint(Base):
    __tablename__ = "mission_waypoints"
    
    id = Column(Integer, primary_key=True, index=True)
    mission_id = Column(Integer, ForeignKey("missions.id", ondelete="CASCADE"), nullable=False)
    sequence = Column(Integer, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    altitude = Column(Float, default=60.0)
    action = Column(String(50), default="fly_through")
    is_reached = Column(Boolean, default=False)
    
    mission = relationship("Mission", back_populates="waypoints")
