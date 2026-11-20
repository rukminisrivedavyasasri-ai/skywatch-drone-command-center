from backend.app.services.geofence import (
    haversine_distance_m,
    calculate_bearing_deg,
    point_in_geofence,
    distance_to_geofence_boundary_m,
    check_all_geofences
)

def test_haversine_distance():
    # Distance between Charminar (17.361564, 78.474665) and Hussain Sagar (17.4239, 78.4738)
    dist = haversine_distance_m(17.361564, 78.474665, 17.4239, 78.4738)
    # Approx 6.9 km = 6900m (+- 200m)
    assert 6500 < dist < 7500

def test_calculate_bearing():
    # Due North: (0, 0) to (1, 0)
    bearing_north = calculate_bearing_deg(0.0, 0.0, 1.0, 0.0)
    assert bearing_north == 0.0 or bearing_north == 360.0
    
    # Due East: (0, 0) to (0, 1)
    bearing_east = calculate_bearing_deg(0.0, 0.0, 0.0, 1.0)
    assert abs(bearing_east - 90.0) < 1.0

def test_point_in_geofence():
    # Square geofence [10, 10] to [12, 12]
    square = [
        [10.0, 10.0],
        [10.0, 12.0],
        [12.0, 12.0],
        [12.0, 10.0],
        [10.0, 10.0]
    ]
    # Point inside
    assert point_in_geofence(11.0, 11.0, square) is True
    # Point outside
    assert point_in_geofence(13.0, 11.0, square) is False
    assert point_in_geofence(9.5, 9.5, square) is False

def test_geofence_breach_evaluations():
    geofences = [
        {
            "id": 1,
            "name": "Restricted Zone",
            "zone_type": "restricted",
            "coordinates": [[10.0, 10.0], [10.0, 12.0], [12.0, 12.0], [12.0, 10.0], [10.0, 10.0]],
            "min_altitude": 0.0,
            "max_altitude": 300.0,
            "is_active": True
        }
    ]
    # Drone inside restricted airspace at 50m
    matches = check_all_geofences(11.0, 11.0, 50.0, geofences)
    assert len(matches) == 1
    assert matches[0]["is_breaching"] is True
    assert matches[0]["zone_type"] == "restricted"

    # Drone above maximum altitude at 400m
    matches_high = check_all_geofences(11.0, 11.0, 400.0, geofences)
    assert matches_high[0]["is_inside"] is True
    assert matches_high[0]["is_breaching"] is False
