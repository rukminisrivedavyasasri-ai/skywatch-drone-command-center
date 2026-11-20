export type UserRole = "ADMIN" | "OPERATOR";

export interface User {
  id: number;
  username: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
}

export type DroneStatus = "active" | "returning" | "low_battery" | "offline" | "emergency";

export interface Drone {
  id: string;
  name: string;
  model: string;
  serial_number: string;
  status: DroneStatus;
  latitude: number;
  longitude: number;
  altitude: number;
  speed: number;
  heading: number;
  battery: number;
  signal_strength: number;
  current_mission_id?: number | null;
  updated_at: string;
}

export interface TelemetrySample {
  id: number;
  drone_id: string;
  timestamp: string;
  latitude: number;
  longitude: number;
  altitude: number;
  speed: number;
  heading: number;
  battery: number;
  signal_strength: number;
  status: DroneStatus;
}

export type GeofenceZoneType = "restricted" | "patrol" | "safe";

export interface Geofence {
  id: number;
  name: string;
  zone_type: GeofenceZoneType;
  description?: string;
  coordinates: [number, number][]; // [lat, lon]
  min_altitude: number;
  max_altitude: number;
  is_active: boolean;
  created_at: string;
}

export type AlertSeverity = "info" | "warning" | "critical";
export type AlertStatus = "active" | "acknowledged" | "resolved";

export interface Alert {
  id: number;
  drone_id?: string | null;
  alert_type: string;
  severity: AlertSeverity;
  message: string;
  latitude?: number | null;
  longitude?: number | null;
  status: AlertStatus;
  created_at: string;
  resolved_at?: string | null;
  acknowledged_by?: string | null;
}

export interface BoundingBox {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface DetectionItem {
  class_name: string;
  confidence: number;
  bbox: BoundingBox;
  latitude: number;
  longitude: number;
}

export interface DetectionAnalysisResult {
  image_url: string;
  annotated_image_url: string;
  is_mock: boolean;
  processing_time_ms: number;
  detections: DetectionItem[];
  counts_by_class: Record<string, number>;
  drone_id?: string | null;
  drone_position?: {
    latitude: number;
    longitude: number;
    altitude: number;
    heading: number;
  } | null;
}

export interface Detection {
  id: number;
  drone_id?: string | null;
  image_path: string;
  class_name: string;
  confidence: number;
  bbox_x1: number;
  bbox_y1: number;
  bbox_x2: number;
  bbox_y2: number;
  latitude: number;
  longitude: number;
  is_mock: boolean;
  timestamp: string;
}

export interface MissionWaypoint {
  sequence: number;
  latitude: number;
  longitude: number;
  altitude: number;
  action: string;
}

export interface Mission {
  id: number;
  name: string;
  drone_id?: string | null;
  mission_type: string;
  status: string;
  target_altitude: number;
  overlap_percentage: number;
  estimated_distance_km: number;
  estimated_duration_minutes: number;
  estimated_battery_cost: number;
  area_km2: number;
  boundary_polygon: [number, number][];
  created_at: string;
  waypoints?: MissionWaypoint[];
}

export interface MissionPlanResponse {
  name: string;
  boundary_polygon: [number, number][];
  target_altitude: number;
  overlap_percentage: number;
  estimated_distance_km: number;
  estimated_duration_minutes: number;
  estimated_battery_cost: number;
  area_km2: number;
  waypoints: MissionWaypoint[];
}

export interface AnalyticsSummary {
  total_drones: number;
  drones_active: number;
  drones_returning: number;
  drones_offline: number;
  total_alerts: number;
  active_alerts: number;
  critical_alerts: number;
  total_detections: number;
  detections_today: number;
  total_area_covered_km2: number;
  detections_by_class: Record<string, number>;
  alerts_by_severity: Record<string, number>;
  detections_timeline: { time: string; detections: number }[];
  fleet_battery_status: {
    id: string;
    name: string;
    battery: number;
    status: string;
    altitude: number;
    speed: number;
  }[];
}

export type WSConnectionStatus = "connecting" | "connected" | "disconnected" | "reconnecting";

export interface WSTelemetryMessage {
  type: "FLEET_TELEMETRY";
  timestamp: string;
  drones: Drone[];
}

export interface WSAlertMessage {
  type: "ALERT_NEW";
  alert: Alert;
}

export interface WSDetectionMessage {
  type: "DETECTION_NEW";
  detection: {
    id: number;
    drone_id: string;
    class_name: string;
    confidence: number;
    latitude: number;
    longitude: number;
    timestamp: string;
  };
}
