from backend.app.services.mission_planner import generate_lawnmower_path, polygon_area_km2

def test_polygon_area_calculation():
    # Roughly 1km x 1km square around Hyderabad (1 deg lat approx 111km -> 0.009 deg approx 1km)
    square = [
        [17.3800, 78.4800],
        [17.3800, 78.4890],
        [17.3890, 78.4890],
        [17.3890, 78.4800],
        [17.3800, 78.4800]
    ]
    area = polygon_area_km2(square)
    # Expected area ~ 0.9 to 1.1 km2
    assert 0.7 < area < 1.3

def test_lawnmower_path_generation():
    polygon = [
        [17.3810, 78.4810],
        [17.3810, 78.4870],
        [17.3870, 78.4870],
        [17.3870, 78.4810],
        [17.3810, 78.4810]
    ]
    plan = generate_lawnmower_path(
        polygon_coords=polygon,
        altitude=50.0,
        overlap_percentage=70.0
    )
    
    assert plan is not None
    assert len(plan.waypoints) >= 4
    assert plan.estimated_distance_km > 0.0
    assert plan.estimated_duration_minutes > 0.0
    assert plan.estimated_battery_cost > 0.0
    # Waypoints must follow sequential order
    sequences = [wp.sequence for wp in plan.waypoints]
    assert sequences == list(range(1, len(plan.waypoints) + 1))
