import json
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from backend.app.db.session import SessionLocal, init_db
from backend.app.models.models import User, Drone, Geofence, Alert, Detection, Mission, MissionWaypoint
from backend.app.core.security import hash_password

def seed_database():
    """Seed initial demo users, drones, geofences, and initial incidents."""
    init_db()
    db: Session = SessionLocal()
    try:
        # 1. Seed Users if not present
        if db.query(User).count() == 0:
            admin_user = User(
                username="admin",
                hashed_password=hash_password("Admin@SkyWatch2026"),
                full_name="Chief Inspector Sarah Chen",
                role="ADMIN",
                is_active=True
            )
            operator_user = User(
                username="operator",
                hashed_password=hash_password("Operator@SkyWatch2026"),
                full_name="Tactical Operator Marcus Vance",
                role="OPERATOR",
                is_active=True
            )
            db.add_all([admin_user, operator_user])
            db.commit()
            print("[SEED] Created demo users (admin, operator)")

        # 2. Seed Geofences
        if db.query(Geofence).count() == 0:
            # Restricted Red Zone (e.g. Government Complex / Charminar Heritage Security)
            restricted_coords = [
                [17.3615, 78.4735],
                [17.3625, 78.4760],
                [17.3590, 78.4770],
                [17.3580, 78.4740],
                [17.3615, 78.4735]
            ]
            # Patrol Zone (Hussain Sagar lake surveillance)
            patrol_coords = [
                [17.4200, 78.4680],
                [17.4320, 78.4730],
                [17.4300, 78.4830],
                [17.4180, 78.4790],
                [17.4200, 78.4680]
            ]
            # Safe Landing Zone (Base Command Station)
            safe_coords = [
                [17.3820, 78.4840],
                [17.3870, 78.4840],
                [17.3870, 78.4890],
                [17.3820, 78.4890],
                [17.3820, 78.4840]
            ]
            # Cyber Security Hub Perimeter (Tech Corridor)
            tech_restricted = [
                [17.4450, 78.3750],
                [17.4520, 78.3820],
                [17.4480, 78.3910],
                [17.4390, 78.3850],
                [17.4450, 78.3750]
            ]

            gf1 = Geofence(
                name="Charminar High-Security Red Zone",
                zone_type="restricted",
                description="Strict No-Fly Zone: Heritage Security Corridor",
                coordinates=json.dumps(restricted_coords),
                min_altitude=0.0,
                max_altitude=300.0,
                is_active=True
            )
            gf2 = Geofence(
                name="Hussain Sagar Lake Patrol Sector-4",
                zone_type="patrol",
                description="Active Maritime & Promenade Surveillance Zone",
                coordinates=json.dumps(patrol_coords),
                min_altitude=30.0,
                max_altitude=150.0,
                is_active=True
            )
            gf3 = Geofence(
                name="SkyWatch Base Station Safe Hub",
                zone_type="safe",
                description="Primary Autonomous Recharge & Emergency Landing Hub",
                coordinates=json.dumps(safe_coords),
                min_altitude=0.0,
                max_altitude=500.0,
                is_active=True
            )
            gf4 = Geofence(
                name="Cyber Towers VIP Buffer",
                zone_type="restricted",
                description="Restricted Critical Infrastructure Airspace",
                coordinates=json.dumps(tech_restricted),
                min_altitude=0.0,
                max_altitude=400.0,
                is_active=True
            )
            db.add_all([gf1, gf2, gf3, gf4])
            db.commit()
            print("[SEED] Created initial geofences")

        # 3. Seed Drones
        if db.query(Drone).count() == 0:
            drones_seed = [
                Drone(
                    id="DRONE-01",
                    name="SkyGuard Alpha",
                    model="DJI Matrice 350 RTK",
                    serial_number="M350-RTK-9901A",
                    status="active",
                    latitude=17.3882,
                    longitude=78.4815,
                    altitude=65.0,
                    speed=12.4,
                    heading=45.0,
                    battery=94.5,
                    signal_strength=98,
                    assigned_route=json.dumps([
                        [17.3882, 78.4815],
                        [17.3940, 78.4860],
                        [17.3910, 78.4920],
                        [17.3850, 78.4880]
                    ])
                ),
                Drone(
                    id="DRONE-02",
                    name="Falcon Sentinel",
                    model="DJI Inspire 3 Cinema",
                    serial_number="INS3-SEC-2041F",
                    status="active",
                    latitude=17.4240,
                    longitude=78.4740,
                    altitude=85.0,
                    speed=14.2,
                    heading=120.0,
                    battery=87.0,
                    signal_strength=92,
                    assigned_route=json.dumps([
                        [17.4240, 78.4740],
                        [17.4280, 78.4780],
                        [17.4220, 78.4800],
                        [17.4190, 78.4720]
                    ])
                ),
                Drone(
                    id="DRONE-03",
                    name="CyberRanger-3",
                    model="Skydio X2D Autonomous",
                    serial_number="SKYD-X2-8842R",
                    status="active",
                    latitude=17.3750,
                    longitude=78.4730,
                    altitude=45.0,
                    speed=9.8,
                    heading=275.0,
                    battery=78.0,
                    signal_strength=89,
                    assigned_route=json.dumps([
                        [17.3750, 78.4730],
                        [17.3710, 78.4680],
                        [17.3680, 78.4750],
                        [17.3730, 78.4790]
                    ])
                ),
                Drone(
                    id="DRONE-04",
                    name="Valkyrie Recon",
                    model="Autel Dragonfish Standard",
                    serial_number="AUT-DF-5519V",
                    status="low_battery",
                    latitude=17.3825,
                    longitude=78.4950,
                    altitude=70.0,
                    speed=11.0,
                    heading=190.0,
                    battery=19.0,
                    signal_strength=84,
                    assigned_route=json.dumps([
                        [17.3825, 78.4950],
                        [17.3850, 78.4866]
                    ])
                ),
                Drone(
                    id="DRONE-05",
                    name="ShadowHawk-X",
                    model="Teledyne FLIR Siras Thermal",
                    serial_number="FLIR-SX-7731S",
                    status="active",
                    latitude=17.4010,
                    longitude=78.4790,
                    altitude=55.0,
                    speed=10.5,
                    heading=310.0,
                    battery=96.0,
                    signal_strength=95,
                    assigned_route=json.dumps([
                        [17.4010, 78.4790],
                        [17.4080, 78.4830],
                        [17.4050, 78.4900],
                        [17.3980, 78.4850]
                    ])
                ),
            ]
            db.add_all(drones_seed)
            db.commit()
            print("[SEED] Created initial fleet of 5 drones")

        # 4. Seed Initial Alerts
        if db.query(Alert).count() == 0:
            now = datetime.now(timezone.utc)
            alerts_seed = [
                Alert(
                    drone_id="DRONE-04",
                    alert_type="low_battery",
                    severity="critical",
                    message="Valkyrie Recon battery dropped to 19%. Autonomous Return-to-Base protocol engaged.",
                    latitude=17.3825,
                    longitude=78.4950,
                    status="active",
                    created_at=now - timedelta(minutes=4)
                ),
                Alert(
                    drone_id="DRONE-03",
                    alert_type="geofence_breach",
                    severity="warning",
                    message="CyberRanger-3 approached within 50m of Charminar High-Security Red Zone boundary.",
                    latitude=17.3620,
                    longitude=78.4740,
                    status="active",
                    created_at=now - timedelta(minutes=15)
                ),
                Alert(
                    drone_id="DRONE-02",
                    alert_type="detection_anomaly",
                    severity="info",
                    message="Falcon Sentinel optical sensor detected crowd anomaly (cluster of 14 people) in Sector-4.",
                    latitude=17.4245,
                    longitude=78.4750,
                    status="acknowledged",
                    created_at=now - timedelta(minutes=32),
                    acknowledged_by="Marcus Vance"
                ),
                Alert(
                    drone_id="DRONE-05",
                    alert_type="signal_loss",
                    severity="warning",
                    message="ShadowHawk-X RF telemetry link degraded (RSSI 42%). Comm switched to auxiliary failover channel.",
                    latitude=17.4010,
                    longitude=78.4790,
                    status="resolved",
                    created_at=now - timedelta(hours=1),
                    resolved_at=now - timedelta(minutes=50),
                    acknowledged_by="Sarah Chen"
                )
            ]
            db.add_all(alerts_seed)
            db.commit()
            print("[SEED] Created initial alerts")

        # 5. Seed Initial Detections
        if db.query(Detection).count() == 0:
            now = datetime.now(timezone.utc)
            detections_seed = [
                Detection(
                    drone_id="DRONE-01",
                    image_path="/sample_data/aerial_images/aerial_sample_1.jpg",
                    class_name="vehicle",
                    confidence=0.94,
                    bbox_x1=120.0,
                    bbox_y1=180.0,
                    bbox_x2=240.0,
                    bbox_y2=320.0,
                    latitude=17.3888,
                    longitude=78.4822,
                    is_mock=True,
                    timestamp=now - timedelta(minutes=12)
                ),
                Detection(
                    drone_id="DRONE-01",
                    image_path="/sample_data/aerial_images/aerial_sample_1.jpg",
                    class_name="truck",
                    confidence=0.88,
                    bbox_x1=340.0,
                    bbox_y1=200.0,
                    bbox_x2=510.0,
                    bbox_y2=390.0,
                    latitude=17.3891,
                    longitude=78.4830,
                    is_mock=True,
                    timestamp=now - timedelta(minutes=12)
                ),
                Detection(
                    drone_id="DRONE-02",
                    image_path="/sample_data/aerial_images/aerial_sample_2.jpg",
                    class_name="person",
                    confidence=0.86,
                    bbox_x1=280.0,
                    bbox_y1=140.0,
                    bbox_x2=330.0,
                    bbox_y2=220.0,
                    latitude=17.4248,
                    longitude=78.4755,
                    is_mock=True,
                    timestamp=now - timedelta(minutes=30)
                ),
                Detection(
                    drone_id="DRONE-03",
                    image_path="/sample_data/aerial_images/aerial_sample_3.jpg",
                    class_name="car",
                    confidence=0.91,
                    bbox_x1=180.0,
                    bbox_y1=250.0,
                    bbox_x2=290.0,
                    bbox_y2=380.0,
                    latitude=17.3755,
                    longitude=78.4738,
                    is_mock=True,
                    timestamp=now - timedelta(minutes=45)
                )
            ]
            db.add_all(detections_seed)
            db.commit()
            print("[SEED] Created initial detections")

    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
