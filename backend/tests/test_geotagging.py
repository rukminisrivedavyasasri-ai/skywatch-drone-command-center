from backend.app.services.detection import pixel_to_latlon

def test_pixel_to_latlon_center():
    # If pixel is exactly at center of image, lat/lon should equal drone lat/lon
    drone_lat = 17.385044
    drone_lon = 78.486671
    img_w, img_h = 800, 600
    
    target_lat, target_lon = pixel_to_latlon(
        pixel_x=400,
        pixel_y=300,
        img_width=img_w,
        img_height=img_h,
        drone_lat=drone_lat,
        drone_lon=drone_lon,
        drone_alt=50.0,
        drone_heading=0.0
    )
    
    assert abs(target_lat - drone_lat) < 0.00001
    assert abs(target_lon - drone_lon) < 0.00001

def test_pixel_to_latlon_offset_north():
    # Top of image (y < 300) when heading is 0 (North) should project to a higher latitude
    drone_lat = 17.385044
    drone_lon = 78.486671
    img_w, img_h = 800, 600
    
    target_lat, target_lon = pixel_to_latlon(
        pixel_x=400,
        pixel_y=100,  # forward along camera axis
        img_width=img_w,
        img_height=img_h,
        drone_lat=drone_lat,
        drone_lon=drone_lon,
        drone_alt=60.0,
        drone_heading=0.0
    )
    
    assert target_lat > drone_lat
    assert abs(target_lon - drone_lon) < 0.00001
