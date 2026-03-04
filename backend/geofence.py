"""
Geofence validation for Gal Oya National Park
Checks if detection coordinates fall within park boundaries
"""
from shapely.geometry import Point, Polygon
from typing import Tuple

# Gal Oya National Park boundary coordinates (approximate)
# Format: (longitude, latitude) pairs
# Source: Based on Gal Oya National Park boundaries in Sri Lanka
GAL_OYA_BOUNDARY = [
    (81.370, 7.290),   # Northwest corner
    (81.450, 7.290),   # Northeast corner
    (81.480, 7.180),   # Southeast corner (extended)
    (81.460, 7.100),   # South corner
    (81.380, 7.080),   # Southwest corner
    (81.340, 7.150),   # West-Southwest
    (81.350, 7.230),   # West-Northwest
    (81.370, 7.290),   # Closing the polygon
]

# Create Polygon object
gal_oya_polygon = Polygon(GAL_OYA_BOUNDARY)


def is_inside_gal_oya(latitude: float, longitude: float) -> bool:
    """
    Check if the given coordinates are inside Gal Oya National Park boundaries.
    
    Args:
        latitude (float): Latitude coordinate
        longitude (float): Longitude coordinate
        
    Returns:
        bool: True if inside the park, False if outside
    """
    point = Point(longitude, latitude)
    return gal_oya_polygon.contains(point)


def get_location_status(latitude: float, longitude: float) -> dict:
    """
    Get detailed location status including distance from boundary if outside.
    
    Args:
        latitude (float): Latitude coordinate
        longitude (float): Longitude coordinate
        
    Returns:
        dict: Location status with details
    """
    is_inside = is_inside_gal_oya(latitude, longitude)
    point = Point(longitude, latitude)
    
    # Calculate distance to boundary (in degrees, approximate)
    distance_to_boundary = gal_oya_polygon.exterior.distance(point)
    
    # Approximate conversion: 1 degree ≈ 111 km at equator
    distance_km = distance_to_boundary * 111
    
    return {
        "is_inside": is_inside,
        "location": "inside" if is_inside else "outside",
        "distance_to_boundary_km": round(distance_km, 2),
        "park_name": "Gal Oya National Park",
        "coordinates": {
            "latitude": latitude,
            "longitude": longitude
        }
    }


def validate_coordinates(latitude: float, longitude: float) -> Tuple[bool, str]:
    """
    Validate if coordinates are within reasonable range and check boundary.
    
    Args:
        latitude (float): Latitude coordinate
        longitude (float): Longitude coordinate
        
    Returns:
        Tuple[bool, str]: (is_valid, message)
    """
    # Basic coordinate validation
    if not (-90 <= latitude <= 90):
        return False, "Invalid latitude: must be between -90 and 90"
    
    if not (-180 <= longitude <= 180):
        return False, "Invalid longitude: must be between -180 and 180"
    
    # Check if in Sri Lanka region (rough bounds)
    if not (5.9 <= latitude <= 9.9 and 79.5 <= longitude <= 82.0):
        return False, "Coordinates are outside Sri Lanka"
    
    return True, "Coordinates are valid"


# Default/fallback coordinates (center of Gal Oya)
DEFAULT_COORDINATES = {
    "latitude": 7.19,
    "longitude": 81.4
}


if __name__ == "__main__":
    # Test cases
    print("=" * 60)
    print("🗺️  Gal Oya Geofence Testing")
    print("=" * 60)
    
    test_cases = [
        (7.19, 81.4, "Center of Gal Oya"),
        (7.25, 81.41, "Inside Gal Oya (North)"),
        (7.15, 81.39, "Inside Gal Oya (South)"),
        (7.29, 81.35, "Edge point (North boundary)"),
        (6.93, 79.85, "Colombo (Outside - West Sri Lanka)"),
        (7.30, 80.64, "Kandy (Outside - Central Sri Lanka)"),
        (9.66, 80.01, "Jaffna (Outside - North Sri Lanka)"),
    ]
    
    for lat, lon, description in test_cases:
        status = get_location_status(lat, lon)
        is_valid, msg = validate_coordinates(lat, lon)
        
        print(f"\n📍 {description}")
        print(f"   Coordinates: ({lat}, {lon})")
        print(f"   Valid: {is_valid}")
        print(f"   Location: {status['location'].upper()}")
        print(f"   Distance to boundary: {status['distance_to_boundary_km']} km")
