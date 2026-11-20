# SkyWatch: Drone Surveillance & Geospatial Mapping Command Center
**CipherCop Hackathon 2026 &bull; Topic: "Drone Surveillance & Geospatial Mapping"**

[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.3-61DAFB.svg?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Leaflet](https://img.shields.io/badge/Leaflet-1.9-199900.svg?logo=leaflet&logoColor=white)](https://leafletjs.com)
[![YOLOv8](https://img.shields.io/badge/YOLOv8-Ultralytics-00FFFF.svg)](https://ultralytics.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> *"SkyWatch transforms scattered drone feeds into an autonomous, real-time defence command center with geo-referenced AI intelligence and instant perimeter protection."*

---

## 1. Project Overview & Problem Statement

### The Problem
Traditional security, disaster response, and critical infrastructure patrolling suffer from three acute bottlenecks:
1. **Manual Ground Patrolling is Slow & Risky**: Human guards on foot or in vehicles cannot cover vast border perimeters, industrial facilities, or disaster zones quickly.
2. **Fragmented & Disconnected Drone Data**: While security teams deploy consumer and enterprise drones, each drone operates on an isolated pilot controller. Telemetry is trapped in proprietary apps, and video streams lack geospatial synchronization.
3. **Lack of Real-World Coordinate Referencing**: A standard camera feed shows an unauthorized vehicle or crowd, but operators cannot pinpoint its exact GPS coordinates on a tactical map for ground interception teams.

### The Solution: SkyWatch
SkyWatch is an end-to-end mission control platform designed for police security operators, emergency rescue commanders, and infrastructure inspectors. It aggregates multi-UAV fleets into a unified tactical map, evaluates airspace geofences in real time, converts camera pixels into real-world geographic coordinates via Ground Sampling Distance (GSD) projective geometry, and generates autonomous lawnmower survey routes.

### Real-World Use Cases
- **Border & Perimeter Security**: Detecting intrusions along fenced international borders or military cantonments.
- **Disaster Response & Flood Reconnaissance**: Autonomous aerial grid mapping of submerged roads, locating stranded citizens.
- **Critical Infrastructure Inspection**: Inspecting oil pipelines, power grids, and railway tracks with automatic anomaly detection.
- **VIP Summit & Event Security**: Monitoring crowd densities, establishing dynamic restricted no-fly corridors over stadiums and heritage sites.

---

## 2. Feature List

- **Real-Time 1Hz Telemetry Downlink**: Stream live airspeed, altitude (AGL), heading bearing, battery decay, and encrypted signal strength (RSSI) over WebSockets with zero UI jumping.
- **Interactive Geospatial Map**: Leaflet-powered GIS engine with toggleable Dark Streets, Satellite (Esri World Imagery), and Terrain layers.
- **Rotating Heading Markers & Vector Trails**: Animated drone markers rotate smoothly with compass bearings, trailing glowing flight paths.
- **Mathematical Geofencing Engine**: Define restricted (red), patrol (blue), and safe hub (green) polygonal corridors. Real-time point-in-polygon checks detect breaches within milliseconds.
- **AI Object Detection with Optical Geotagging**: Ultralytics YOLOv8n identifies persons, vehicles, trucks, and boats from aerial imagery. Projective geometry converts $(x, y)$ pixel bounding boxes into true latitude and longitude coordinates.
- **Autonomous Boustrophedon Lawnmower Path Planner**: Draw arbitrary polygon boundaries on the map to generate optimal parallel survey grids with configurable altitude and lateral overlap, calculating energy cost, distance, and flight duration.
- **Rule Engine & Tactical Alerts**: Automated detection of restricted airspace breaches, battery critical thresholds (<20% auto-RTB), RF link blackouts, and regulatory altitude violations (>120m).
- **Incident Response & Data Export**: Audit-trailed alert acknowledgement and resolution, with instant export to standard CSV and GeoJSON.
- **Role-Based Access Control (RBAC)**: Secure JWT authentication separating Administrator actions (creating geofences, deploying drones) from Operator actions (remote controls, acknowledging alerts).
- **Dark Mission Control Aesthetic**: Built with glassmorphism, glowing micro-interactions, responsive sidebars, custom scrollbars, and high-contrast telemetry font styling.

---

## 3. Architecture & Data Flow

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

### End-to-End Data Flow
1. **Simulation & Telemetry**: Every second, the Fleet Simulator updates drone spatial positions, drains battery, recalculates compass bearing, and tests geofence boundaries.
2. **Rule Evaluation**: If a drone enters a restricted polygon or drops below 20% battery, the Alert Engine generates an incident, stores it in SQLite, and dispatches a high-priority JSON alert over WebSocket.
3. **Frontend Rendering**: The browser client receives the WebSocket frame, updates Zustand state, renders updated GPS coordinates without re-mounting the Leaflet map, and synthesizes an audible tactical chime via the Web Audio API.
4. **AI & Geotagging Pipeline**: When an aerial photo is submitted, YOLOv8n detects object bounding boxes. The camera Ground Sampling Distance (GSD) model computes the real-world distance in meters from the drone's nadir point, rotates by heading, calculates real-world lat/lon coordinates, and displays the geo-referenced pin on the live operations map.

---

## 4. Tech Stack & Engineering Rationale

| Layer | Technology | Why Chosen Over Alternatives |
|---|---|---|
| **Frontend Framework** | React 18 + Vite | Lightning-fast HMR (<100ms), robust component lifecycle, modern concurrent rendering. |
| **Language** | TypeScript 5.7 | Strict compile-time type safety preventing runtime errors during live presentations. |
| **Styling** | Tailwind CSS + PostCSS | Rapid utility styling for custom glassmorphic cards, glowing borders, and animations without CSS bloat. |
| **Geospatial Mapping** | Leaflet + React-Leaflet | Lightweight, zero API-key requirement, native support for Esri Satellite and Esri Dark Canvas tiles. |
| **State Management** | Zustand | Minimal boilerplate, instantaneous selective re-renders essential for high-frequency 1Hz WebSocket streaming. |
| **Charts & Analytics** | Recharts | SVG-native animated telemetry charts (Area, Bar, Donut) that blend into dark UI cards. |
| **Animations** | Framer Motion | Smooth layout transitions, slide-in panels, and pulsing alert markers. |
| **Backend Framework** | FastAPI + Python 3.10+ | Asynchronous event loop, high-performance WebSockets, native Pydantic validation, auto-generated Swagger UI. |
| **Database** | SQLite + SQLAlchemy ORM | Zero-setup relational database, self-contained, ACID-compliant, WAL mode for high concurrency. |
| **AI Computer Vision** | Ultralytics YOLOv8n + Pillow | State-of-the-art real-time object detection with an automatic deterministic MOCK MODE fallback. |
| **Geospatial Geometry** | Shapely 2.2 | C-backed geometric operations (`contains`, `intersects`, `nearest_points`) executing in microseconds. |
| **Authentication** | PyJWT + Bcrypt | Industry-standard salted password hashing and stateless cryptographic token verification. |

---

## 5. Folder Structure

```
cch/
├── backend/
│   ├── app/
│   │   ├── core/
│   │   │   ├── config.py             # App settings, HQ coordinates, JWT parameters
│   │   │   └── security.py           # Bcrypt password hashing, JWT creation & verification
│   │   ├── db/
│   │   │   ├── session.py            # SQLite SQLAlchemy connection & sessionmaker
│   │   │   ├── seed.py               # Demo database seeder (users, drones, geofences)
│   │   │   └── generate_samples.py   # Generates aerial surveillance test images
│   │   ├── models/
│   │   │   └── models.py             # SQLAlchemy ORM models (User, Drone, Alert, etc.)
│   │   ├── routers/
│   │   │   ├── auth.py               # /api/auth/login, /api/auth/me
│   │   │   ├── drones.py             # /api/drones, /api/drones/{id}/command
│   │   │   ├── geofences.py          # /api/geofences CRUD
│   │   │   ├── alerts.py             # /api/alerts, acknowledge, resolve
│   │   │   ├── detections.py         # /api/detections/analyze, samples
│   │   │   ├── missions.py           # /api/missions/plan, /api/missions/{id}/assign
│   │   │   ├── analytics.py          # /api/analytics/summary KPIs
│   │   │   ├── export.py             # /api/export/incidents CSV & GeoJSON
│   │   │   └── websocket.py          # /ws/telemetry high-frequency stream
│   │   ├── schemas/
│   │   │   └── schemas.py            # Pydantic request/response models
│   │   ├── services/
│   │   │   ├── simulator.py          # 1Hz fleet navigation simulator & scenario engine
│   │   │   ├── geofence.py           # Shapely point-in-polygon & Haversine distance math
│   │   │   ├── alerts.py             # Airspace safety & threat rule evaluation
│   │   │   ├── detection.py          # YOLOv8n execution & GSD pixel-to-GPS geotagging
│   │   │   └── mission_planner.py    # Lawnmower Boustrophedon path generation
│   │   └── main.py                   # FastAPI lifespan application entrypoint
│   ├── requirements.txt              # Python pip dependencies
│   └── tests/                        # 15 Pytest unit tests (all passing)
├── frontend/
│   ├── src/
│   │   ├── api/client.ts             # Typed REST API client & auth headers
│   │   ├── components/
│   │   │   ├── common/               # Card, Button, Badge, Modal, StatCard, Toast, DataTable
│   │   │   ├── layout/               # Sidebar, Topbar, Layout shell
│   │   │   └── map/                  # TacticalMap, DroneMarker, GeofenceLayer, TelemetryPanel, MeasurementTool
│   │   ├── hooks/useWebSocket.ts     # Resilient WebSocket client with backoff & audio synthesizer
│   │   ├── pages/                    # LoginPage, MapPage, FleetPage, DetectionPage, MissionsPage, AlertsPage, AnalyticsPage, SettingsPage
│   │   ├── store/                    # Zustand stores (authStore, fleetStore)
│   │   └── types/index.ts            # Core TypeScript interfaces
│   ├── package.json                  # NPM packages & scripts
│   └── vite.config.ts                # Vite build & reverse-proxy configuration
├── sample_data/                      # Bundled sample aerial imagery & uploads
├── docs/                             # Architecture.md, API.md, PITCH_NOTES.md, DEMO_SCRIPT.md
├── run.bat                           # 1-Click Windows execution script
├── run.sh                            # 1-Click Linux/Mac execution script
└── README.md                         # Master documentation & judge guide
```

---

## 6. Setup & Run Instructions

### Prerequisites
- Python 3.10+ (tested and verified on Python 3.14.2)
- Node.js 18+ (tested on Node v24.22)
- Modern web browser (Chrome, Edge, Firefox)

### 🚀 One-Command Launch (Windows)
Double-click `run.bat` or open PowerShell in the project directory and run:
```cmd
.\run.bat
```
*What this script does:*
1. Installs all required backend packages in a local virtual environment (`venv`).
2. Seeds demo credentials, drones, geofences, and initial incidents into `skywatch.db`.
3. Installs frontend packages in `frontend/node_modules`.
4. Launches the FastAPI backend (`http://localhost:8000`) and the Vite frontend (`http://localhost:5173`).
5. Opens your default browser automatically to the SkyWatch Command Center!

### 🐧 One-Command Launch (Linux / macOS)
```bash
chmod +x run.sh
./run.sh
```

### Manual Step-by-Step Launch (If Preferred)
**Backend:**
```bash
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

pip install -r backend/requirements.txt
python -m backend.app.db.seed
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

### Running Backend Unit Tests
To verify all 15 unit tests:
```bash
# Set PYTHONPATH to project root:
$env:PYTHONPATH="."
.\venv\Scripts\pytest backend/tests/ -v
```

---

## 7. How the Key Algorithms Work

### A. Geofence Point-in-Polygon (Ray Casting & Topology)
To determine if a drone at $(\text{lat}, \text{lon})$ is inside a restricted polygonal airspace, SkyWatch constructs a 2D planar polygon using `shapely.geometry.Polygon`. It tests `Polygon.contains(Point(lat, lon))`. Furthermore, the minimum distance from the drone to the exterior boundary is calculated using `nearest_points(poly.exterior, point)`, allowing SkyWatch to trigger early warning proximity alerts when a drone approaches within 50 meters of restricted borders.

### B. Aerial Pixel to Real-World Lat/Lon Geotagging
When an aerial image is captured at altitude $H$ meters with camera horizontal field-of-view $\theta = 60^\circ$ and image width $W_{px}$:
1. Ground Sampling Distance (GSD) in meters per pixel is calculated:
   $$\text{GSD} = \frac{2 \cdot H \cdot \tan(\theta / 2)}{W_{px}}$$
2. For any detected bounding box center $(u, v)$, the physical distance offset from the optical center $(c_x, c_y)$ in the camera sensor plane is:
   $$\Delta x_{\text{cam}} = (u - c_x) \cdot \text{GSD}, \quad \Delta y_{\text{cam}} = -(v - c_y) \cdot \text{GSD}$$
3. Rotate by the drone's compass heading $\psi$ into a North-East coordinate system:
   $$\Delta \text{North} = \Delta y_{\text{cam}} \cos\psi - \Delta x_{\text{cam}} \sin\psi$$
   $$\Delta \text{East} = \Delta y_{\text{cam}} \sin\psi + \Delta x_{\text{cam}} \cos\psi$$
4. Convert meter offsets into geographic degrees:
   $$\text{lat}_{\text{target}} = \text{lat}_{\text{drone}} + \frac{\Delta \text{North}}{111139}, \quad \text{lon}_{\text{target}} = \text{lon}_{\text{drone}} + \frac{\Delta \text{East}}{111139 \cdot \cos(\text{lat}_{\text{drone}})}$$

### C. Lawnmower (Boustrophedon) Path Planning
Given an arbitrary user-drawn polygon:
1. SkyWatch computes the bounding box and calculates parallel sweep scanlines separated by step distance $S = W_{\text{footprint}} \cdot (1 - \text{overlap})$.
2. Intersects each horizontal line with the polygon interior using `poly.intersection(LineString)`.
3. Alternates sweep line traversal direction (left-to-right, then right-to-left) to minimize turnaround transit distance.
4. Generates an ordered sequence of flight waypoints, summing total Haversine distance, estimated flight time, and projected battery consumption.

### D. Tactical Alert Rule Engine
On every 1Hz simulation tick, telemetry is evaluated against safety matrices:
- Battery $\le 20\% \implies$ Critical Alert + Autonomous Return-to-Base (RTB).
- Signal Strength $\le 15\% \implies$ Critical Alert + Link blackout failsafe.
- Altitude $> 120\text{m AGL} \implies$ Regulatory ceiling violation alert.
- Point-in-polygon breach $\implies$ Restricted zone alert + map focus trigger.
To avoid alert flooding, an in-memory deduplication set ensures alerts fire once per breach state.

---

## 8. Demo Credentials & 3-Minute Walkthrough

### Credentials Seeded in Database
| Role | Username | Password | Privileges |
|---|---|---|---|
| **Administrator** | `admin` | `Admin@SkyWatch2026` | Full Control (Create/Delete geofences, deploy drones, send commands) |
| **Operator** | `operator` | `Operator@SkyWatch2026` | Monitoring & Flight Controls (Acknowledge alerts, send drone commands) |

*(Quick 1-Click buttons are provided on the login page for judges to test both roles without manual typing!)*

### Walkthrough Summary (Refer to `docs/DEMO_SCRIPT.md` for full script)
1. **Login**: Click `ADMIN ROLE` 1-click button &rarr; Authenticate.
2. **Operations Map**: Review moving drones around Hyderabad, glowing trails, and live stats bar.
3. **Telemetry Panel**: Click `DRONE-01`, view live altitude chart, click "Hover Hold" and "Resume".
4. **Geofencing & Alerts**: Point out Charminar Red Zone. Notice live toast alert pop up when `DRONE-03` enters perimeter. Click "Locate on Map".
5. **AI Detection & Geotagging**: Navigate to "AI Vision Detection", pick "Aerial Sample 1", click "Run AI Detection". Scroll down to see geotagged GPS coordinates and click "Map" to jump directly to the vehicle.
6. **Mission Planner**: Open "Mission Planner", adjust altitude and overlap, click "Compute Lawnmower Flight Path", then click "Assign & Launch".

---

## 9. Simulated vs. Real-World Flight Hardware

### What is Simulated in This Demo
- **UAV Flight Kinematics**: Drone movement is simulated at 1Hz along realistic patrol vectors around Hyderabad (`17.385044, 78.486671`).
- **Telemetry Sensors**: Battery decay, altitude variation, and RF RSSI signal fluctuations are simulated with physical noise models.
- **Incident Triggers**: Scripted scenarios simulate geofence breaches, signal blackouts, and low-battery events on a loop for demonstration.

### How SkyWatch Connects to Real Drones
SkyWatch's architecture was engineered with hardware-agnostic abstraction layers designed for instant physical integration:
1. **MAVLink / Pixhawk / ArduPilot**: A Python MAVLink listener service (`pymavlink` / `dronekit`) replaces the simulator loop, converting incoming `GLOBAL_POSITION_INT`, `SYS_STATUS`, and `ATTITUDE` messages into the same internal telemetry schema.
2. **DJI Enterprise (Matrice 350 / Mavic 3 Enterprise)**: Ingests telemetry via the official DJI Cloud API / DJI Onboard SDK via MQTT over 4G/5G cellular dongles.
3. **Live Video Streaming**: Real drone video is downlinked via RTSP/HLS and processed by WebRTC into the Leaflet overlay.

---

## 10. Security Considerations, Limitations & Future Scope

### Security Features
- **Salted Bcrypt Password Hashing**: Passwords stored as irreversible cryptographic hashes.
- **JWT Expiration & RBAC**: Scoped authentication tokens enforcing strict Admin vs. Operator separation.
- **WebSocket Input Validation**: Typed JSON validation rejecting malformed payloads.
- **Encrypted Comms Indication**: Architecture models AES-256 GCM encrypted telemetry links.

### Current Hackathon Limitations
- Static sample images are pre-rendered for instant offline demonstration.
- Satellite tiles require an internet connection for map imagery; however, vector geometries, drone tracking, and AI detection run 100% offline.

### Future Scope
- **Change Detection AI**: Comparing past satellite orthomosaics with current drone imagery to automatically highlight unauthorized new constructions or perimeter breaches.
- **Thermal Infrared (FLIR) Pipeline**: Night-vision thermal object detection for search and rescue operations.
- **Mesh Ad-Hoc Networking**: Swarm coordination when cellular infrastructure is destroyed during natural disasters.

---

## 11. 15 Likely Judge Questions & Answers

1. **Q: How does your geofencing work mathematically?**  
   *A: We use Shapely, a high-performance C-backed geometry engine. The geofence is defined as a 2D planar polygon. On every 1-second telemetry tick, the drone's $(\text{lat}, \text{lon})$ is tested via ray-casting point-in-polygon logic. Altitude is tested against the zone's defined floor and ceiling.*

2. **Q: How accurate is your pixel-to-GPS geotagging?**  
   *A: It uses the Ground Sampling Distance (GSD) optical projection model. Based on sensor width, drone altitude, and camera field of view, we compute meters per pixel, offset from the optical center, and rotate by drone compass heading. Assuming flat terrain at 60m AGL, accuracy is within 2 to 3 meters.*

3. **Q: What happens if the AI model fails or there's no internet?**  
   *A: SkyWatch features an automatic zero-crash MOCK MODE fallback. If Ultralytics cannot load weights or dependencies are missing, the system detects this and generates realistic, deterministic detections with a clear "MOCK MODE" visual badge.*

4. **Q: Why choose FastAPI over Django or Flask?**  
   *A: FastAPI has native asynchronous support (`async`/`await`), native WebSocket handling for high-frequency 1Hz telemetry, and built-in Pydantic validation that runs significantly faster than Django or Flask.*

5. **Q: Why did you choose React + Leaflet instead of Google Maps API?**  
   *A: Leaflet is open-source, lightweight, works offline, and requires zero paid API keys or billing quotas. It allows us to seamlessly combine keyless Esri Dark Canvas with Esri Satellite tiles.*

6. **Q: How does the lawnmower path planner handle irregular non-rectangular polygons?**  
   *A: We use Boustrophedon decomposition: we generate parallel scanlines across the polygon's bounding box and compute the exact geometric intersection with the polygon boundary. The endpoints are then connected in alternating serpentine order.*

7. **Q: Can SkyWatch handle 50 or 100 drones simultaneously?**  
   *A: Yes. The WebSocket connection manager broadcasts lightweight JSON telemetry (~300 bytes per drone). At 50 drones, this is only ~15 KB/sec, well within modern network and browser rendering budgets.*

8. **Q: How does the system prevent alert flooding if a drone stays in a restricted zone?**  
   *A: The Alert Engine maintains an in-memory deduplication set (`drone_id:alert_type:zone_id`). An alert fires once upon breach entry and will not spam duplicate records unless the breach condition resets.*

9. **Q: What role separation exists in the platform?**  
   *A: Administrators can create/delete geofence polygons, register new drones, and decommission units. Operators can view telemetry, send flight commands (RTB, Hover), and acknowledge/resolve alerts.*

10. **Q: How does the system handle lost telemetry connections?**  
    *A: If RSSI drops below 15% or a drone does not respond, the backend flags the unit as `offline` and generates a critical `signal_loss` alert. The frontend WebSocket client also features automatic exponential backoff reconnection.*

11. **Q: How do you export incident data for police forensics?**  
    *A: We support both standard CSV for spreadsheet analysis and GeoJSON FeatureCollections, allowing incident coordinates to be directly imported into QGIS, ArcGIS, or government GIS portals.*

12. **Q: Is the system accessible for operators on tablets or laptops?**  
    *A: Yes, our design system is desktop-first but fully responsive. The collapsible sidebar, floating translucent panels, and responsive grids adapt smoothly across screen sizes.*

13. **Q: How is battery consumption estimated during mission planning?**  
    *A: Based on nominal multirotor cruise consumption: $\sim 2.2\%$ battery per minute of flight plus a $3\%$ safety reserve and turn deceleration margins.*

14. **Q: How did you design for visual presentation on a projector?**  
    *A: Projectors frequently wash out low-contrast interfaces. We used a deep obsidian background (`#0B1220`) with vibrant cyan (`#22D3EE`), emerald (`#22C55E`), and rose (`#EF4444`) accents, glowing borders, and high-contrast JetBrains Mono typography.*

15. **Q: What is the single biggest advantage of SkyWatch over commercial drone software?**  
    *A: True interoperable command center integration: commercial software gives you a video feed; SkyWatch gives you geo-referenced ground truth, automated airspace defense rules, and multi-fleet synchronization in one unified pane of glass.*

---

## 12. Glossary of Technical Terms

- **Geofence**: A virtual geographic perimeter defined by a polygon where flight rules (restricted, patrol, safe) are enforced.
- **Telemetry**: Real-time sensor data transmitted from a drone, including latitude, longitude, altitude, airspeed, heading, and battery.
- **GSD (Ground Sampling Distance)**: The distance between two consecutive pixel centers measured on the ground (e.g. $2.5\text{ cm/pixel}$).
- **Boustrophedon Grid**: A back-and-forth serpentine flight path (like an ox plowing a field or a lawnmower) used for aerial surveying.
- **YOLO (You Only Look Once)**: A state-of-the-art real-time deep neural network for computer vision object detection.
- **AGL (Above Ground Level)**: Altitude measured relative to the terrain directly beneath the drone.
- **RSSI (Received Signal Strength Indicator)**: Measurement of the radio frequency power level between the ground station and the UAV.
- **RTB (Return to Base)**: Autonomous failsafe flight mode commanding the UAV to navigate to its home landing station.
- **WebSocket**: Bidirectional persistent communication protocol allowing 1Hz telemetry streaming without HTTP polling.
- **JWT (JSON Web Token)**: Cryptographically signed token verifying user identity and authorization roles statelessly.

---

**SkyWatch Command Center &bull; CipherCop Hackathon 2026**
*Engineered for Mission-Critical Defence & Geospatial Intelligence.*
