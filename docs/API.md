# SkyWatch API Reference & WebSocket Specification
Version 1.0.0 &bull; CipherCop Hackathon 2026

Base URL: `http://localhost:8000/api`
Interactive Swagger UI: `http://localhost:8000/docs`
Interactive ReDoc UI: `http://localhost:8000/redoc`

---

## 1. Authentication (`/auth`)

### `POST /auth/login`
Authenticates an operator or administrator and issues a JWT token.
- **Request Body (JSON)**:
  ```json
  {
    "username": "admin",
    "password": "Admin@SkyWatch2026"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "access_token": "eyJhbGciOi...",
    "token_type": "bearer",
    "user": {
      "id": 1,
      "username": "admin",
      "full_name": "Chief Inspector Sarah Chen",
      "role": "ADMIN",
      "is_active": true
    }
  }
  ```

### `GET /auth/me`
Returns the currently authenticated user's profile.
- **Headers**: `Authorization: Bearer <token>`
- **Response `200 OK`**: `UserResponse`

---

## 2. Fleet Telemetry & Remote Control (`/drones`)

### `GET /drones`
List all registered drones in the fleet with real-time telemetry.

### `GET /drones/{id}`
Returns a single drone's real-time state along with historical telemetry points.

### `POST /drones` *(ADMIN only)*
Registers a new UAV into the fleet.

### `POST /drones/{id}/command`
Sends tactical commands to a drone.
- **Command Types**:
  - `return_to_base`: Commands drone to fly to Command HQ (`17.385044, 78.486671`) and recharge.
  - `pause`: Drone holds position (hover).
  - `resume`: Resumes autonomous patrol.
  - `goto`: Dispatches drone to `[target_latitude, target_longitude]`.
  - `assign_route`: Sets a list of waypoint coordinates `[[lat, lon], ...]`.

---

## 3. Geofencing (`/geofences`)

### `GET /geofences`
Lists all operational geofences (Restricted, Patrol, Safe).

### `POST /geofences` *(ADMIN only)*
Creates a new geofence polygon perimeter.
- **Body**:
  ```json
  {
    "name": "Perimeter Alpha",
    "zone_type": "restricted",
    "coordinates": [[17.36, 78.47], [17.365, 78.48], [17.355, 78.48], [17.36, 78.47]],
    "min_altitude": 0.0,
    "max_altitude": 300.0,
    "is_active": true
  }
  ```

---

## 4. Alerts & Incident Management (`/alerts`)

### `GET /alerts`
Query filtered incident logs. Query parameters: `drone_id`, `severity` (`info|warning|critical`), `status` (`active|acknowledged|resolved`), `limit`, `offset`.

### `PATCH /alerts/{id}/ack`
Acknowledge an active security incident.

### `PATCH /alerts/{id}/resolve`
Resolve an incident with audit timestamp.

---

## 5. AI Vision & Geotagging (`/detections`)

### `POST /detections/analyze`
Multipart image analysis executing YOLOv8n object detection and camera GSD projective geotagging.
- **Form Data**:
  - `file`: image file (optional if sample chosen)
  - `sample_filename`: filename from bundled sample gallery (optional)
  - `drone_id`: drone context ID (e.g. `DRONE-01`)
  - `force_mock`: boolean flag (optional)
- **Response**:
  ```json
  {
    "image_url": "/sample_data/uploads/...",
    "annotated_image_url": "/sample_data/annotated/...",
    "is_mock": false,
    "processing_time_ms": 38.4,
    "detections": [
      {
        "class_name": "car",
        "confidence": 0.94,
        "bbox": { "x1": 120, "y1": 180, "x2": 240, "y2": 320 },
        "latitude": 17.3888,
        "longitude": 78.4822
      }
    ],
    "counts_by_class": { "car": 1 }
  }
  ```

---

## 6. Autonomous Mission Planner (`/missions`)

### `POST /missions/plan`
Generates a boustrophedon (lawnmower) flight path over an arbitrary polygon.
- **Body**:
  ```json
  {
    "name": "Sector 4 Survey",
    "polygon": [[17.38, 78.48], [17.38, 78.49], [17.39, 78.49], [17.39, 78.48]],
    "altitude": 60.0,
    "overlap_percentage": 70.0
  }
  ```

### `POST /missions/{id}/assign`
Assigns the mission path to a drone and launches autonomous flight.

---

## 7. Real-time WebSocket Stream (`/ws/telemetry`)
- **URL**: `ws://localhost:8000/ws/telemetry?token=<jwt_token>`
- **Downlink Messages**:
  1. `FLEET_TELEMETRY` (Broadcast 1Hz):
     ```json
     {
       "type": "FLEET_TELEMETRY",
       "timestamp": "2026-11-19T10:00:00Z",
       "drones": [...]
     }
     ```
  2. `ALERT_NEW`:
     ```json
     {
       "type": "ALERT_NEW",
       "alert": { "id": 12, "severity": "critical", "message": "Airspace breach" }
     }
     ```
  3. `DETECTION_NEW`:
     ```json
     {
       "type": "DETECTION_NEW",
       "detection": { "id": 4, "class_name": "vehicle", "confidence": 0.92 }
     }
     ```
