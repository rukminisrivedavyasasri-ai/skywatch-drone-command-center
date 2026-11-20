import json
from backend.app.models.models import Drone, Geofence
from backend.app.services.alerts import AlertEngine

def test_alert_rule_low_battery(db_session):
    # Reset alert engine state
    AlertEngine._recent_alert_keys.clear()
    
    drone = Drone(
        id="TEST-DRONE-BATT",
        name="Test Battery Drone",
        serial_number="TEST-SN-001",
        status="active",
        latitude=17.3850,
        longitude=78.4866,
        altitude=50.0,
        speed=10.0,
        battery=18.5,  # <= 20% critical threshold
        signal_strength=95
    )
    db_session.add(drone)
    db_session.commit()

    alerts = AlertEngine.evaluate_drone_telemetry(drone, [], db_session)
    assert len(alerts) >= 1
    assert any(a.alert_type == "low_battery" and a.severity == "critical" for a in alerts)

def test_alert_rule_altitude_violation(db_session):
    AlertEngine._recent_alert_keys.clear()
    
    drone = Drone(
        id="TEST-DRONE-ALT",
        name="Test Ceiling Drone",
        serial_number="TEST-SN-002",
        status="active",
        latitude=17.3850,
        longitude=78.4866,
        altitude=135.0,  # > 120m regulatory ceiling
        speed=10.0,
        battery=90.0,
        signal_strength=95
    )
    db_session.add(drone)
    db_session.commit()

    alerts = AlertEngine.evaluate_drone_telemetry(drone, [], db_session)
    assert any(a.alert_type == "altitude_violation" for a in alerts)
