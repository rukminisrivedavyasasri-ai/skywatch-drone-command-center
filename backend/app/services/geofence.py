import math
from typing import Optional
from shapely.geometry import Point, Polygon
from shapely.ops import nearest_points

def haversine_distance_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate the great-circle distance between two points in meters using Haversine formula."""
    R = 6371000.0  # Earth's radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (math.sin(delta_phi / 2.0) ** 2 +
         math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c

def calculate_bearing_deg(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate the forward initial bearing (heading) in degrees (0..360)."""
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_lambda = math.radians(lon2 - lon1)

    y = math.sin(delta_lambda) * math.cos(phi2)
    x = math.cos(phi1) * math.sin(phi2) - math.sin(phi1) * math.cos(phi2) * math.cos(delta_lambda)
    bearing_rad = math.atan2(y, x)
    bearing_deg = (math.degrees(bearing_rad) + 360.0) % 360.0
    return round(bearing_deg, 1)

def point_in_geofence(lat: float, lon: float, polygon_coords: list[list[float]]) -> bool:
    """Check if point (lat, lon) is strictly within polygon boundary using Shapely."""
    if len(polygon_coords) < 3:
        return False
    # Notice: coordinates in GIS polygon can be (lon, lat) or (lat, lon)
    # We standardize polygon_coords as [lat, lon]
    poly = Polygon([(p[0], p[1]) for p in polygon_coords])
    pt = Point(lat, lon)
    return poly.contains(pt) or poly.touches(pt)

def distance_to_geofence_boundary_m(lat: float, lon: float, polygon_coords: list[list[float]]) -> float:
    """Compute approximate distance in meters from (lat, lon) to nearest point on geofence perimeter."""
    if len(polygon_coords) < 3:
        return float("inf")
    poly = Polygon([(p[0], p[1]) for p in polygon_coords])
    pt = Point(lat, lon)
    
    # Nearest point on exterior boundary
    nearest_geom = nearest_points(poly.exterior, pt)[0]
    return haversine_distance_m(lat, lon, nearest_geom.x, nearest_geom.y)

def check_all_geofences(lat: float, lon: float, altitude: float, geofences: list[dict]) -> list[dict]:
    """
    Check position against all active geofences.
    Returns list of matching geofences with breach status and distance to perimeter.
    """
    matches = []
    for gf in geofences:
        if not gf.get("is_active", True):
            continue
        coords = gf.get("coordinates", [])
        if not coords or len(coords) < 3:
            continue
        
        inside = point_in_geofence(lat, lon, coords)
        dist_m = distance_to_geofence_boundary_m(lat, lon, coords)
        
        min_alt = gf.get("min_altitude", 0.0)
        max_alt = gf.get("max_altitude", 500.0)
        alt_breach = min_alt <= altitude <= max_alt

        matches.append({
            "geofence_id": gf.get("id"),
            "name": gf.get("name"),
            "zone_type": gf.get("zone_type"),
            "is_inside": inside,
            "altitude_breach": alt_breach,
            "is_breaching": inside and alt_breach,
            "distance_to_boundary_m": round(dist_m, 1)
        })
    return matches
