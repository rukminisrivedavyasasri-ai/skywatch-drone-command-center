import sys
import os
from fastapi.testclient import TestClient

# Ensure root in sys.path
sys.path.insert(0, os.path.abspath("."))

from backend.app.main import app

def run_verification():
    client = TestClient(app)
    
    print("--- 1. Testing Health Endpoint ---")
    res = client.get("/api/health")
    print(f"Health check: {res.status_code}, {res.json()}")
    assert res.status_code == 200

    print("\n--- 2. Testing Authentication ---")
    login_res = client.post(
        "/api/auth/login",
        json={"username": "admin", "password": "Admin@SkyWatch2026"}
    )
    print(f"Admin login status: {login_res.status_code}")
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    print("\n--- 3. Testing Drones Listing ---")
    drones_res = client.get("/api/drones", headers=headers)
    drones = drones_res.json()
    print(f"Drones returned: {len(drones)} units")
    assert len(drones) >= 5

    print("\n--- 4. Testing Geofences ---")
    gf_res = client.get("/api/geofences", headers=headers)
    gfs = gf_res.json()
    print(f"Geofences returned: {len(gfs)} zones")
    assert len(gfs) >= 3

    print("\n--- 5. Testing Alerts ---")
    alerts_res = client.get("/api/alerts", headers=headers)
    alerts = alerts_res.json()
    print(f"Alerts returned: {len(alerts)} records")
    assert len(alerts) >= 1

    print("\n--- 6. Testing Analytics Summary ---")
    analytics_res = client.get("/api/analytics/summary", headers=headers)
    print(f"Analytics status: {analytics_res.status_code}")
    assert analytics_res.status_code == 200
    summary = analytics_res.json()
    print(f"Total drones: {summary['total_drones']}, Active: {summary['drones_active']}, Area: {summary['total_area_covered_km2']} km²")

    print("\n--- 7. Testing Mission Planner ---")
    plan_res = client.post(
        "/api/missions/plan",
        headers=headers,
        json={
            "name": "Verification Grid",
            "polygon": [
                [17.3820, 78.4820],
                [17.3820, 78.4900],
                [17.3890, 78.4900],
                [17.3890, 78.4820],
                [17.3820, 78.4820]
            ],
            "altitude": 60.0,
            "overlap_percentage": 70.0
        }
    )
    print(f"Mission plan status: {plan_res.status_code}")
    assert plan_res.status_code == 200
    plan = plan_res.json()
    print(f"Planned waypoints: {len(plan['waypoints'])}, Estimated dist: {plan['estimated_distance_km']}km")

    print("\n--- 8. Testing AI Detection on Sample Image ---")
    det_res = client.post(
        "/api/detections/analyze",
        headers=headers,
        data={
            "drone_id": "DRONE-01",
            "sample_filename": "aerial_sample_1.jpg",
            "force_mock": "true"
        }
    )
    print(f"AI Detection status: {det_res.status_code}")
    assert det_res.status_code == 200
    det_data = det_res.json()
    print(f"Detections count: {len(det_data['detections'])}, Is Mock: {det_data['is_mock']}, Time: {det_data['processing_time_ms']}ms")

    print("\n--- 9. Testing Data Exports (CSV & GeoJSON) ---")
    csv_res = client.get("/api/export/incidents?format=csv", headers=headers)
    assert csv_res.status_code == 200
    assert "Incident ID" in csv_res.text
    print(f"CSV export verified: {len(csv_res.text)} bytes")

    geojson_res = client.get("/api/export/incidents?format=geojson", headers=headers)
    assert geojson_res.status_code == 200
    assert "FeatureCollection" in geojson_res.text
    print(f"GeoJSON export verified: {len(geojson_res.text)} bytes")

    print("\n=======================================================")
    print(">>> ALL END-TO-END VERIFICATION CHECKS PASSED (100%) <<<")
    print("=======================================================")

if __name__ == "__main__":
    run_verification()
