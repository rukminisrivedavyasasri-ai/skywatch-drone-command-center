# SkyWatch: Drone Surveillance & Geospatial Mapping Command Center
## System Architecture & Technical Specification
CipherCop Hackathon 2026

### 1. High-Level Architecture Overview
SkyWatch is a mission-grade drone surveillance and geospatial intelligence platform engineered for police/defence security operators, emergency disaster response teams, and critical infrastructure inspectors.

```mermaid
flowchart TB
    subgraph Frontend ["SkyWatch Mission Control (React 18 + Vite + TypeScript)"]
        UI["Tactical Glassmorphic UI\n(Tailwind CSS + Framer Motion)"]
        State["Fleet & Alert State Store\n(Zustand)"]
        Map["Geospatial Tactical Map\n(React-Leaflet: Dark / Satellite / Terrain)"]
        WSClient["WebSocket Client\n(Auto-reconnect with Exponential Backoff)"]
        APICli["REST API Client\n(JWT Bearer Auth)"]
    end

    subgraph Backend ["SkyWatch Backend Engine (FastAPI + Python 3.10+)"]
        API["FastAPI REST Routers\n(/auth, /drones, /geofences, /alerts, /detections, /missions, /analytics)"]
        WSManager["WebSocket Connection Manager\n(/ws/telemetry)"]
        Sim["Fleet Simulator Engine\n(5 Drones, 1Hz Tick, Realistic Physics & Scenarios)"]
        GeoEngine["Geospatial & Rule Engine\n(Shapely Polygon/Point, Haversine, Bearing)"]
        MissionPlan["Survey Planner Engine\n(Boustrophedon Lawnmower Path Generator)"]
        YOLO["AI Detection Pipeline\n(YOLOv8n + OpenCV/Pillow + Mock Mode Fallback)"]
        DB[(SQLite + SQLAlchemy ORM\nWAL Mode)]
    end

    UI --> State
    Map --> State
    WSClient -->|Telemetry & Live Alerts (1Hz)| State
    APICli --> API
    WSClient <-->|WebSocket Stream| WSManager

    WSManager <--> Sim
    Sim --> GeoEngine
    GeoEngine -->|Breach / Low Battery / Signal Loss| WSManager
    API --> DB
    Sim --> DB
    MissionPlan --> DB
    YOLO --> DB
    API --> YOLO
```

### 2. Component Structure & Data Flow
1. **Fleet Simulator (`backend/app/services/simulator.py`)**:
   - Manages 5 patrol drones operating around Hyderabad (Command Center center: `17.385044, 78.486671`).
   - Simulates true GPS, altitude (20-120m), speed (8-15 m/s), battery decay, heading, signal strength (RSSI), gimbal pitch, and state machine (IDLE, PATROLLING, RETURNING, EMERGENCY, OFFLINE).
   - Loops scripted tactical scenarios: geofence breach into restricted zones, automatic return-to-base on low battery (<20%), intermittent signal blackouts (10s), and automated aerial anomaly detections.
2. **Geospatial & Rule Engine (`backend/app/services/geofence.py` & `alerts.py`)**:
   - Geofence polygon breach detection via Shapely `Polygon.contains(Point)`.
   - Dynamic alert evaluation: geofence violations, altitude/speed limits, battery critical thresholds, signal loss, and unauthorized detections within red zones.
3. **AI Vision & Geotagging (`backend/app/services/detection.py`)**:
   - Aerial image object detection via Ultralytics YOLOv8n with seamless, deterministic MOCK MODE fallback.
   - GSD (Ground Sampling Distance) & Camera Field of View (FOV) projective mapping: converts pixel bounding box centers $(u, v)$ to real-world latitude and longitude coordinates based on drone altitude, heading, gimbal tilt, and camera sensor parameters.
4. **Mission Planner (`backend/app/services/mission_planner.py`)**:
   - Takes arbitrary user-drawn polygon boundaries on the map.
   - Rotates polygon to optimal sweep angle, generates parallel boustrophedon (lawnmower) flight grid lines with user-defined overlap (e.g. 70%) and altitude.
   - Calculates total survey distance, estimated flight duration, battery consumption, and land area covered in $\text{km}^2$.
5. **Modern Mission Control UI (`frontend/src`)**:
   - Dark command center palette: Slate-950 (`#0B1220`), Glass cards (`#111A2E` with 8% white border and backdrop blur), Cyan-400 accent (`#22D3EE`), and Violet-500 secondary.
   - High-contrast tactical telemetry displays using JetBrains Mono.
   - Full-screen tactical map with live drone headings, glowing trail histories, cluster markers, heatmap overlay, and coordinate crosshairs.
