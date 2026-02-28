from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut
import time

geolocator = Nominatim(user_agent="civic_hazard_ai")

# Simple in-memory cache to reduce repeated API calls
location_cache = {}


def get_coordinates(location_name):
    if not location_name:
        return None

    # Check cache first
    if location_name in location_cache:
        return location_cache[location_name]

    try:
        location = geolocator.geocode(location_name + ", India")

        # Prevent rapid API calls (important for OpenStreetMap)
        time.sleep(1)

        if location:
            coords = {
                "latitude": location.latitude,
                "longitude": location.longitude
            }

            location_cache[location_name] = coords
            return coords

    except GeocoderTimedOut:
        return None

    return None