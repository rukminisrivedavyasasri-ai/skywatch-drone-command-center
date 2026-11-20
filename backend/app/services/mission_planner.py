import math
from typing import Optional
from shapely.geometry import Polygon, LineString, MultiLineString
from backend.app.schemas.schemas import MissionPlanResponse, MissionWaypointItem
from backend.app.services.geofence import haversine_distance_m

def polygon_area_km2(coordinates: list[list[float]]) -> float:
    """Calculate geographic area of a polygon in square kilometers."""
    if len(coordinates) < 3:
        return 0.0
    
    # Project to approximate planar meters using central latitude
    center_lat = sum(p[0] for p in coordinates) / len(coordinates)
    lat_to_m = 111139.0
    lon_to_m = 111139.0 * math.cos(math.radians(center_lat))
    
    # Shoelace formula on meter coordinates
    meter_coords = [(p[1] * lon_to_m, p[0] * lat_to_m) for p in coordinates]
    n = len(meter_coords)
    area = 0.0
    for i in range(n):
        j = (i + 1) % n
        area += meter_coords[i][0] * meter_coords[j][1]
        area -= meter_coords[j][0] * meter_coords[i][1]
    
    area_m2 = abs(area) / 2.0
    return round(area_m2 / 1_000_000.0, 4)

def generate_lawnmower_path(
    polygon_coords: list[list[float]],
    altitude: float = 60.0,
    overlap_percentage: float = 70.0,
    camera_fov_deg: float = 60.0,
    drone_speed_ms: float = 10.0
) -> MissionPlanResponse:
    """
    Generate a boustrophedon (lawnmower) flight path over an arbitrary polygon.
    """
    if len(polygon_coords) < 3:
        raise ValueError("Polygon must have at least 3 vertices.")
    
    poly = Polygon([(p[0], p[1]) for p in polygon_coords])
    if not poly.is_valid:
        poly = poly.buffer(0)
    
    # 1. Ground Footprint and Line Spacing
    # Ground width W = 2 * h * tan(FOV/2)
    fov_rad = math.radians(camera_fov_deg)
    ground_width_m = 2.0 * altitude * math.tan(fov_rad / 2.0)
    overlap_fraction = min(max(overlap_percentage / 100.0, 0.1), 0.95)
    line_spacing_m = ground_width_m * (1.0 - overlap_fraction)
    # Ensure minimum line spacing to avoid excessive waypoints
    line_spacing_m = max(line_spacing_m, 12.0)
    
    # Convert line spacing in meters to latitude degrees (approx 1 deg = 111,139 m)
    lat_step = line_spacing_m / 111139.0
    
    min_lat, min_lon, max_lat, max_lon = poly.bounds
    
    # Generate parallel horizontal latitude lines from min_lat to max_lat
    # Add buffer on longitude for intersection lines
    lon_pad = (max_lon - min_lon) * 0.1 or 0.005
    line_lat = min_lat + (lat_step / 2.0)
    
    sweep_segments: list[list[tuple[float, float]]] = []
    
    while line_lat <= max_lat:
        test_line = LineString([(line_lat, min_lon - lon_pad), (line_lat, max_lon + lon_pad)])
        intersection = poly.intersection(test_line)
        
        if not intersection.is_empty:
            if isinstance(intersection, LineString):
                coords = list(intersection.coords)
                if len(coords) >= 2:
                    sweep_segments.append([coords[0], coords[-1]])
            elif isinstance(intersection, MultiLineString):
                for geom in intersection.geoms:
                    coords = list(geom.coords)
                    if len(coords) >= 2:
                        sweep_segments.append([coords[0], coords[-1]])
        
        line_lat += lat_step

    # Fallback if no sweep lines generated (e.g. tiny polygon)
    if not sweep_segments:
        centroid = poly.centroid
        waypoints = [
            MissionWaypointItem(sequence=1, latitude=centroid.x, longitude=centroid.y, altitude=altitude, action="hover_scan")
        ]
        return MissionPlanResponse(
            name="Point Survey",
            boundary_polygon=polygon_coords,
            target_altitude=altitude,
            overlap_percentage=overlap_percentage,
            estimated_distance_km=0.1,
            estimated_duration_minutes=1.0,
            estimated_battery_cost=2.0,
            area_km2=polygon_area_km2(polygon_coords),
            waypoints=waypoints
        )

    # 2. Alternating Boustrophedon Serpentine Order
    ordered_points: list[tuple[float, float]] = []
    left_to_right = True
    
    for segment in sweep_segments:
        p1, p2 = segment[0], segment[1]
        # p is (lat, lon)
        if left_to_right:
            # Sort by longitude ascending
            start, end = (p1, p2) if p1[1] <= p2[1] else (p2, p1)
        else:
            # Sort by longitude descending
            start, end = (p1, p2) if p1[1] >= p2[1] else (p2, p1)
            
        ordered_points.append(start)
        ordered_points.append(end)
        left_to_right = not left_to_right

    # 3. Create Waypoints
    waypoints: list[MissionWaypointItem] = []
    for seq, pt in enumerate(ordered_points, start=1):
        action = "fly_through"
        if seq == 1:
            action = "takeoff_enter"
        elif seq == len(ordered_points):
            action = "complete_survey"
            
        waypoints.append(
            MissionWaypointItem(
                sequence=seq,
                latitude=round(pt[0], 6),
                longitude=round(pt[1], 6),
                altitude=round(altitude, 1),
                action=action
            )
        )

    # 4. Calculate Distance, Time, and Battery Metrics
    total_dist_m = 0.0
    for i in range(len(ordered_points) - 1):
        p_a = ordered_points[i]
        p_b = ordered_points[i + 1]
        total_dist_m += haversine_distance_m(p_a[0], p_a[1], p_b[0], p_b[1])
        
    dist_km = round(total_dist_m / 1000.0, 2)
    # Flight time: distance / speed + corner turns (approx 2s per corner)
    turns_count = len(sweep_segments) * 2
    cruise_seconds = total_dist_m / max(drone_speed_ms, 5.0)
    total_seconds = cruise_seconds + (turns_count * 2.5)
    duration_minutes = round(total_seconds / 60.0, 1)
    
    # Battery estimate: ~2.2% per minute of flight + 3% margin
    battery_cost = round(min(duration_minutes * 2.2 + 3.0, 100.0), 1)
    area_km2 = polygon_area_km2(polygon_coords)

    return MissionPlanResponse(
        name="Autonomous Grid Survey",
        boundary_polygon=polygon_coords,
        target_altitude=altitude,
        overlap_percentage=overlap_percentage,
        estimated_distance_km=dist_km,
        estimated_duration_minutes=duration_minutes,
        estimated_battery_cost=battery_cost,
        area_km2=area_km2,
        waypoints=waypoints
    )
