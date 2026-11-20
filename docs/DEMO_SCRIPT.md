# SkyWatch: 3-Minute Live Presentation & Demo Script
CipherCop Hackathon 2026 — Topic: "Drone Surveillance & Geospatial Mapping"

---

## 🎬 Quick Setup Checklist Before Taking the Stage
1. Run `run.bat` (or `./run.sh`). Both backend (Port 8000) and frontend (Port 5173) start in 3 seconds.
2. Open browser to `http://localhost:5173`.
3. Press `F11` in browser for full-screen immersive projector mode.

---

## ⏱️ Step-by-Step 3-Minute Demo Walkthrough

### Act 1: The Login & Security Foundation (0:00 - 0:30)
- **What to show**:
  - Show the dark mission control login page with rotating radar sweep animation.
  - Point out the **Demo Credentials (Judges)** callout box.
  - Click the **"ADMIN ROLE"** 1-click autofill button (`admin / Admin@SkyWatch2026`).
  - Click **"Authenticate & Access HQ"**.
- **What to say**:
  > *"Notice our modern dark command center aesthetic. We have seeded demo credentials for both Administrator and Operator roles right on the login screen. SkyWatch issues an encrypted JWT bearer token with granular role permissions."*

---

### Act 2: Live Operations Map & Telemetry Downlink (0:30 - 1:15)
- **What to show**:
  - Land on the full-screen interactive **Live Operations Map**.
  - Point to the **Top Stats Bar**: `Fleet Online (5/5)`, `Active Alerts`, `AI Detections (14 TAGGED)`, `Surveillance Grid (28.4 km²)`.
  - Point to the moving drone markers with rotating heading arrows and glowing flight-path trails.
  - Click on **`DRONE-01` (SkyGuard Alpha)** or any drone on the map.
  - Observe the **Right Telemetry Panel** slide in with battery gauge, altitude, airspeed, heading, GPS coords, and live altitude area chart.
  - Click the **"Hover Hold"** command button, then click **"Resume"**.
  - Show the **Layer Switcher** (top-right): toggle Satellite layer (Esri World Imagery) and dark street layer.
  - Show the **Measurement Tool**: click Ruler, click two points on the map to show real-time Haversine distance.
- **What to say**:
  > *"Here is the SkyWatch Operations Room. Five autonomous UAVs are actively patrolling sectors across Hyderabad. Every second, our WebSocket stream downlinks real-time telemetry: altitude, airspeed, compass bearing, battery percentage, and signal strength. When I click a drone, we can send tactical flight commands like Return-to-Base or Hover in place."*

---

### Act 3: Airspace Geofencing & Scripted Incident Breaches (1:15 - 1:50)
- **What to show**:
  - Point out the colored polygon geofences on the map:
    - 🔴 **Red polygon**: Charminar High-Security Restricted No-Fly Zone.
    - 🔵 **Blue polygon**: Hussain Sagar Lake Maritime Patrol Zone.
    - 🟢 **Green polygon**: SkyWatch Base Station Safe Recharge Hub.
  - Watch the live toast alert notification pop up as the scripted scenario triggers: `DRONE-03 entered RESTRICTED zone at 45m altitude!`.
  - Click the alert toast button: **"Locate on Map &rarr;"** — the camera flies directly to the breach coordinates.
  - Navigate to **"Alerts & Incidents"** in the sidebar. Show the incident table, click **"ACK"** to acknowledge an alert, and click **"Export CSV"** and **"Export GeoJSON"**.
- **What to say**:
  > *"SkyWatch enforces mathematical geofencing. Using Shapely point-in-polygon logic, our rule engine detects when a drone violates restricted airspace, exceeds altitude ceilings, or drops below 20% battery. Clicking any alert automatically flies the map to the coordinates, and security teams can export full forensic incident logs to CSV and GeoJSON with one click."*

---

### Act 4: AI Object Detection & Real-World Geotagging (1:50 - 2:30)
- **What to show**:
  - Click **"AI Vision Detection"** in the sidebar.
  - Point out the sensor drone dropdown (`DRONE-01`).
  - Click on bundled sample image: **"Aerial Sample 1"** (Road Junction).
  - Click **"Run AI Detection & Geotag"**.
  - Show the detected bounding boxes, class labels (`CAR 94%`, `TRUCK 89%`, `PERSON 87%`), processing time (`~37ms`), and the detected classes bar chart.
  - Crucial moment: Scroll to **"Geotagged Real-World GPS"** panel. Click **"Map &rarr;"** next to a detected vehicle.
  - The tactical map opens and zooms directly to the vehicle's geo-referenced coordinates!
- **What to say**:
  > *"This is our core AI breakthrough. Traditional computer vision just gives you pixel boxes. SkyWatch combines Ultralytics YOLOv8 with a Ground Sampling Distance projective camera model. It converts pixel coordinates into real-world latitude and longitude based on drone altitude and heading. When I click 'Map', that vehicle is now a permanent geospatial asset in our intelligence database."*

---

### Act 5: Autonomous Lawnmower Mission Planner (2:30 - 3:00)
- **What to show**:
  - Click **"Mission Planner"** in the sidebar.
  - Adjust the **Target Altitude** slider to `60m` and **Lateral Overlap** to `70%`.
  - Click **"Compute Lawnmower Flight Path"**.
  - Show the generated boustrophedon serpentine flight waypoints, estimated distance (`32.1 km`), estimated flight time (`48.2 min`), and battery cost (`38.5%`).
  - Click **"Assign & Launch Drone Autonomously"**.
  - Show confirmation notification that the drone has accepted the flight plan.
- **What to say**:
  > *"Finally, when security teams need to survey a newly flooded zone or search perimeter, our Mission Planner automatically generates an optimal Boustrophedon lawnmower path, calculates energy cost, and assigns it to a drone for autonomous execution. SkyWatch delivers end-to-end mission readiness."*
