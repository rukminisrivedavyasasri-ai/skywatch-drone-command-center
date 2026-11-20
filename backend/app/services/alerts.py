import json
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy.orm import Session
from backend.app.models.models import Alert, Drone, Geofence
from backend.app.services.geofence import check_all_geofences

class AlertEngine:
    """Evaluates telemetry against tactical security & flight safety rules."""
    
    # Track recent active alerts in memory to prevent alert flooding/duplicate spamming
    _recent_alert_keys: set[str] = set()

    @classmethod
    def evaluate_drone_telemetry(cls, drone: Drone, geofences: list[Geofence], db: Session) -> list[Alert]:
        """Check all flight safety and airspace rules for a drone."""
        new_alerts: list[Alert] = []
        now = datetime.now(timezone.utc)

        # 1. Low Battery Rules
        if drone.battery <= 20.0 and drone.status != "offline":
            key = f"{drone.id}:low_battery:critical"
            if key not in cls._recent_alert_keys:
                alert = Alert(
                    drone_id=drone.id,
                    alert_type="low_battery",
                    severity="critical",
                    message=f"{drone.name} ({drone.id}) battery critical: {drone.battery:.1f}%. Autonomous Return-to-Base protocol engaged.",
                    latitude=drone.latitude,
                    longitude=drone.longitude,
                    status="active",
                    created_at=now
                )
                db.add(alert)
                new_alerts.append(alert)
                cls._recent_alert_keys.add(key)
        elif drone.battery <= 30.0 and drone.status != "offline":
            key = f"{drone.id}:low_battery:warning"
            if key not in cls._recent_alert_keys:
                alert = Alert(
                    drone_id=drone.id,
                    alert_type="low_battery",
                    severity="warning",
                    message=f"{drone.name} ({drone.id}) battery low: {drone.battery:.1f}%. Recommended to plan landing.",
                    latitude=drone.latitude,
                    longitude=drone.longitude,
                    status="active",
                    created_at=now
                )
                db.add(alert)
                new_alerts.append(alert)
                cls._recent_alert_keys.add(key)
        else:
            # Clear battery alerts if recharged
            cls._recent_alert_keys.discard(f"{drone.id}:low_battery:critical")
            cls._recent_alert_keys.discard(f"{drone.id}:low_battery:warning")

        # 2. RF Signal Degradation Rules
        if drone.signal_strength <= 15:
            key = f"{drone.id}:signal_loss:critical"
            if key not in cls._recent_alert_keys:
                alert = Alert(
                    drone_id=drone.id,
                    alert_type="signal_loss",
                    severity="critical",
                    message=f"CRITICAL: Link blackout on {drone.name} ({drone.id}). Telemetry RSSI at {drone.signal_strength}%.",
                    latitude=drone.latitude,
                    longitude=drone.longitude,
                    status="active",
                    created_at=now
                )
                db.add(alert)
                new_alerts.append(alert)
                cls._recent_alert_keys.add(key)
        elif drone.signal_strength <= 35:
            key = f"{drone.id}:signal_loss:warning"
            if key not in cls._recent_alert_keys:
                alert = Alert(
                    drone_id=drone.id,
                    alert_type="signal_loss",
                    severity="warning",
                    message=f"RF Telemetry link weak on {drone.name} ({drone.id}): {drone.signal_strength}%. Possible interference.",
                    latitude=drone.latitude,
                    longitude=drone.longitude,
                    status="active",
                    created_at=now
                )
                db.add(alert)
                new_alerts.append(alert)
                cls._recent_alert_keys.add(key)
        else:
            cls._recent_alert_keys.discard(f"{drone.id}:signal_loss:critical")
            cls._recent_alert_keys.discard(f"{drone.id}:signal_loss:warning")

        # 3. Altitude & Speed Limits
        if drone.altitude > 120.0:
            key = f"{drone.id}:altitude_violation"
            if key not in cls._recent_alert_keys:
                alert = Alert(
                    drone_id=drone.id,
                    alert_type="altitude_violation",
                    severity="warning",
                    message=f"{drone.name} ({drone.id}) exceeded maximum regulatory ceiling: {drone.altitude:.1f}m AGL (>120m).",
                    latitude=drone.latitude,
                    longitude=drone.longitude,
                    status="active",
                    created_at=now
                )
                db.add(alert)
                new_alerts.append(alert)
                cls._recent_alert_keys.add(key)
        else:
            cls._recent_alert_keys.discard(f"{drone.id}:altitude_violation")

        if drone.speed > 22.0:
            key = f"{drone.id}:speed_violation"
            if key not in cls._recent_alert_keys:
                alert = Alert(
                    drone_id=drone.id,
                    alert_type="speed_violation",
                    severity="warning",
                    message=f"{drone.name} ({drone.id}) excessive airspeed detected: {drone.speed:.1f} m/s (>22 m/s).",
                    latitude=drone.latitude,
                    longitude=drone.longitude,
                    status="active",
                    created_at=now
                )
                db.add(alert)
                new_alerts.append(alert)
                cls._recent_alert_keys.add(key)
        else:
            cls._recent_alert_keys.discard(f"{drone.id}:speed_violation")

        # 4. Geofence Breaches
        gf_dicts = []
        for gf in geofences:
            try:
                coords = json.loads(gf.coordinates) if isinstance(gf.coordinates, str) else gf.coordinates
                gf_dicts.append({
                    "id": gf.id,
                    "name": gf.name,
                    "zone_type": gf.zone_type,
                    "coordinates": coords,
                    "min_altitude": gf.min_altitude,
                    "max_altitude": gf.max_altitude,
                    "is_active": gf.is_active
                })
            except Exception:
                continue

        evaluations = check_all_geofences(drone.latitude, drone.longitude, drone.altitude, gf_dicts)
        for ev in evaluations:
            if ev["is_breaching"]:
                if ev["zone_type"] == "restricted":
                    key = f"{drone.id}:geofence_breach:{ev['geofence_id']}"
                    if key not in cls._recent_alert_keys:
                        alert = Alert(
                            drone_id=drone.id,
                            alert_type="geofence_breach",
                            severity="critical",
                            message=f"AIRSPACE BREACH: {drone.name} entered RESTRICTED zone '{ev['name']}' at {drone.altitude:.0f}m altitude!",
                            latitude=drone.latitude,
                            longitude=drone.longitude,
                            status="active",
                            created_at=now
                        )
                        db.add(alert)
                        new_alerts.append(alert)
                        cls._recent_alert_keys.add(key)
            else:
                cls._recent_alert_keys.discard(f"{drone.id}:geofence_breach:{ev['geofence_id']}")

        if new_alerts:
            db.commit()
            for a in new_alerts:
                db.refresh(a)

        return new_alerts
