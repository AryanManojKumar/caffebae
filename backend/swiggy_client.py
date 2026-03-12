import httpx
import json
from typing import List, Dict, Optional
from datetime import datetime

class SwiggyClient:
    """
    Unofficial Swiggy API client for learning purposes.
    WARNING: This uses reverse-engineered endpoints and may break anytime.
    """
    
    def __init__(self):
        self.base_url = "https://www.swiggy.com"
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "application/json, text/plain, */*",
            "Accept-Language": "en-US,en;q=0.9",
            "Content-Type": "application/json",
            "Origin": "https://www.swiggy.com",
            "Referer": "https://www.swiggy.com/"
        }
        # City coordinates mapping
        self.city_coords = {
            "mumbai": {"lat": 19.0760, "lng": 72.8777},
            "delhi": {"lat": 28.7041, "lng": 77.1025},
            "bangalore": {"lat": 12.9716, "lng": 77.5946},
            "bengaluru": {"lat": 12.9716, "lng": 77.5946},
            "hyderabad": {"lat": 17.3850, "lng": 78.4867},
            "chennai": {"lat": 13.0827, "lng": 80.2707},
            "kolkata": {"lat": 22.5726, "lng": 88.3639},
            "pune": {"lat": 18.5204, "lng": 73.8567},
            "ahmedabad": {"lat": 23.0225, "lng": 72.5714},
            "jaipur": {"lat": 26.9124, "lng": 75.7873},
            "lucknow": {"lat": 26.8467, "lng": 80.9462},
            "chandigarh": {"lat": 30.7333, "lng": 76.7794},
            "goa": {"lat": 15.2993, "lng": 74.1240},
            "indore": {"lat": 22.7196, "lng": 75.8577},
            "kochi": {"lat": 9.9312, "lng": 76.2673},
            "gurgaon": {"lat": 28.4595, "lng": 77.0266},
            "noida": {"lat": 28.5355, "lng": 77.3910}
        }
    
    def log(self, message, level="INFO"):
        """Simple logging with colors"""
        colors = {
            "INFO": "\033[96m",
            "SUCCESS": "\033[92m",
            "WARNING": "\033[93m",
            "ERROR": "\033[91m"
        }
        timestamp = datetime.now().strftime("%H:%M:%S")
        color = colors.get(level, "\033[0m")
        print(f"{color}[{timestamp}] [SwiggyClient] {message}\033[0m")
    
    def get_coordinates(self, location: str) -> Dict[str, float]:
        """Get lat/lng for a city name"""
        location_lower = location.lower().strip()
        
        # Check if it's a known city
        if location_lower in self.city_coords:
            coords = self.city_coords[location_lower]
            self.log(f"📍 Coordinates for {location}: {coords['lat']}, {coords['lng']}", "SUCCESS")
            return coords
        
        # Default to Mumbai if unknown
        self.log(f"⚠️  Unknown location: {location}, defaulting to Mumbai", "WARNING")
        return self.city_coords["mumbai"]
    
    async def search_restaurants(self, location: str, keyword: str = "", page: int = 0) -> Dict:
        """
        Search for restaurants by location and optional keyword
        Returns dict with restaurants and pagination info
        """
        coords = self.get_coordinates(location)
        
        try:
            self.log(f"🔍 Calling Swiggy API for page {page}...", "INFO")
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                # Use the list endpoint with pagination
                url = f"{self.base_url}/dapi/restaurants/list/v5"
                
                params = {
                    "lat": coords["lat"],
                    "lng": coords["lng"],
                    "is-seo-homepage-enabled": "true",
                    "page_type": "DESKTOP_WEB_LISTING"
                }
                
                # Add offset for pagination
                if page > 0:
                    params["offset"] = page * 15
                    self.log(f"📄 Pagination offset: {page * 15}", "INFO")
                
                # Don't use collection filter - it's too restrictive
                # We'll filter cafes ourselves in parse_restaurant_list
                if keyword:
                    self.log(f"☕ Will filter for keyword: '{keyword}'", "INFO")
                
                self.log(f"🌐 Request URL: {url}", "INFO")
                self.log(f"📋 Request params: {params}", "INFO")
                
                response = await client.get(url, params=params, headers=self.headers)
                
                self.log(f"📡 Response status: {response.status_code}", "INFO")
                
                if response.status_code != 200:
                    self.log(f"❌ Swiggy API error: {response.status_code}", "ERROR")
                    self.log(f"Response: {response.text[:200]}", "ERROR")
                    return {"restaurants": [], "hasMore": False}
                
                data = response.json()
                self.log(f"✅ Received response from Swiggy", "SUCCESS")
                
                restaurants = self.parse_restaurant_list(data, keyword)
                
                # Check if there are more results (if we got a decent amount)
                has_more = len(restaurants) >= 10
                
                self.log(f"🍽️  Parsed {len(restaurants)} restaurants matching '{keyword}'", "SUCCESS")
                self.log(f"➡️  Has more results: {has_more}", "INFO")
                
                return {
                    "restaurants": restaurants,
                    "hasMore": has_more,
                    "page": page
                }
                
        except Exception as e:
            self.log(f"❌ Error fetching from Swiggy: {str(e)}", "ERROR")
            return {"restaurants": [], "hasMore": False}
    
    def parse_restaurant_list(self, data: Dict, keyword: str = "") -> List[Dict]:
        """Parse Swiggy API response and extract restaurant data"""
        restaurants = []
        
        try:
            self.log(f"🔄 Parsing Swiggy response...", "INFO")
            
            # Navigate through Swiggy's nested response structure
            cards = data.get("data", {}).get("cards", [])
            self.log(f"📦 Found {len(cards)} cards in response", "INFO")
            
            total_found = 0
            
            for card in cards:
                card_data = card.get("card", {}).get("card", {})
                
                # Look for restaurant grid
                if "gridElements" in card_data:
                    grid_elements = card_data.get("gridElements", {}).get("infoWithStyle", {}).get("restaurants", [])
                    self.log(f"🏪 Found {len(grid_elements)} restaurants in grid", "INFO")
                    total_found += len(grid_elements)
                    
                    for restaurant in grid_elements:
                        info = restaurant.get("info", {})
                        
                        name = info.get("name", "").lower()
                        cuisines = " ".join(info.get("cuisines", [])).lower()
                        
                        # Filter by keyword if provided
                        if keyword:
                            keyword_lower = keyword.lower()
                            
                            # More flexible matching for cafes
                            cafe_keywords = ['cafe', 'coffee', 'tea', 'bakery', 'dessert', 'beverages']
                            
                            # Check if it's a cafe-related place
                            is_cafe = False
                            if keyword_lower in ['cafe', 'coffee']:
                                # Check name or cuisines for cafe-related terms
                                is_cafe = any(term in name or term in cuisines for term in cafe_keywords)
                            else:
                                # For other keywords, exact match
                                is_cafe = keyword_lower in name or keyword_lower in cuisines
                            
                            if not is_cafe:
                                continue
                        
                        # Extract restaurant data
                        parsed = {
                            "id": info.get("id"),
                            "name": info.get("name", "Unknown Restaurant"),
                            "cuisine": ", ".join(info.get("cuisines", [])),
                            "rating": str(info.get("avgRating", "N/A")),
                            "address": info.get("areaName", "Address not available"),
                            "priceRange": f"₹{info.get('costForTwo', 'N/A')}",
                            "image": self.get_image_url(info.get("cloudinaryImageId")),
                            "distance": f"{info.get('sla', {}).get('lastMileTravelString', 'N/A')}",
                            "deliveryTime": f"{info.get('sla', {}).get('deliveryTime', 'N/A')} mins",
                            "isOpen": info.get("isOpen", True),
                            "lat": info.get("lat"),
                            "lng": info.get("lng")
                        }
                        
                        restaurants.append(parsed)
                        self.log(f"  ✓ {parsed['name']} - {parsed['rating']}⭐ ({parsed['cuisine'][:30]}...)", "SUCCESS")
            
            self.log(f"📊 Total restaurants in response: {total_found}", "INFO")
            self.log(f"✅ Filtered to {len(restaurants)} matching restaurants", "SUCCESS")
            
            return restaurants
            
        except Exception as e:
            self.log(f"❌ Error parsing Swiggy response: {str(e)}", "ERROR")
            return []
    
    def get_image_url(self, image_id: Optional[str]) -> str:
        """Convert Swiggy's cloudinary image ID to full URL"""
        if not image_id:
            return "https://via.placeholder.com/300x200?text=No+Image"
        
        return f"https://media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_660/{image_id}"
    
    async def get_restaurant_menu(self, restaurant_id: str, lat: float, lng: float) -> Dict:
        """Get detailed menu for a restaurant"""
        try:
            self.log(f"📋 Fetching menu for restaurant {restaurant_id}...", "INFO")
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                url = f"{self.base_url}/dapi/menu/pl"
                
                params = {
                    "page-type": "REGULAR_MENU",
                    "complete-menu": "true",
                    "lat": lat,
                    "lng": lng,
                    "restaurantId": restaurant_id,
                    "submitAction": "ENTER"
                }
                
                self.log(f"🌐 Request URL: {url}", "INFO")
                self.log(f"📋 Request params: {params}", "INFO")
                
                response = await client.get(url, params=params, headers=self.headers)
                
                self.log(f"📡 Response status: {response.status_code}", "INFO")
                
                # Accept both 200 and 202 status codes
                if response.status_code not in [200, 202]:
                    self.log(f"❌ Failed to fetch menu: {response.status_code}", "ERROR")
                    return {"error": "Failed to fetch menu", "status": response.status_code}
                
                # Try to parse JSON
                try:
                    data = response.json()
                except Exception as json_error:
                    self.log(f"⚠️  Empty or invalid response (likely rate limited)", "WARNING")
                    return {"error": "Menu temporarily unavailable (rate limited)", "status": response.status_code}
                
                # Check if we got valid data
                if not data.get('data'):
                    self.log(f"⚠️  Empty menu data received", "WARNING")
                    return {"error": "Menu not available", "status": response.status_code}
                
                self.log(f"✅ Menu fetched successfully", "SUCCESS")
                return data
                
        except Exception as e:
            self.log(f"❌ Error fetching menu: {str(e)}", "ERROR")
            return {"error": str(e)}
    
    async def get_restaurant_offers(self, restaurant_id: str, lat: float, lng: float) -> Dict:
        """Get offers/coupons for a restaurant"""
        try:
            self.log(f"🎁 Fetching offers for restaurant {restaurant_id}...", "INFO")
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                url = f"{self.base_url}/dapi/restaurants/list/v5"
                
                params = {
                    "lat": lat,
                    "lng": lng,
                    "is-seo-homepage-enabled": "true",
                    "page_type": "DESKTOP_WEB_LISTING",
                    "restaurantId": restaurant_id
                }
                
                self.log(f"🌐 Request URL: {url}", "INFO")
                self.log(f"📋 Request params: {params}", "INFO")
                
                response = await client.get(url, params=params, headers=self.headers)
                
                self.log(f"📡 Response status: {response.status_code}", "INFO")
                
                if response.status_code != 200:
                    self.log(f"❌ Failed to fetch offers: {response.status_code}", "ERROR")
                    return {"error": "Failed to fetch offers", "status": response.status_code}
                
                try:
                    data = response.json()
                    self.log(f"✅ Offers response received", "SUCCESS")
                    return data
                except Exception as json_error:
                    self.log(f"⚠️  Invalid JSON response", "WARNING")
                    return {"error": "Invalid response", "status": response.status_code}
                
        except Exception as e:
            self.log(f"❌ Error fetching offers: {str(e)}", "ERROR")
            return {"error": str(e)}
    
    async def get_restaurant_reviews(self, restaurant_id: str) -> Dict:
        """Get reviews for a restaurant"""
        try:
            self.log(f"⭐ Fetching reviews for restaurant {restaurant_id}...", "INFO")
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                # Try the reviews endpoint
                url = f"{self.base_url}/dapi/reviews/list"
                
                params = {
                    "restaurantId": restaurant_id,
                    "offset": 0,
                    "sortBy": "RELEVANCE"
                }
                
                self.log(f"🌐 Request URL: {url}", "INFO")
                self.log(f"📋 Request params: {params}", "INFO")
                
                response = await client.get(url, params=params, headers=self.headers)
                
                self.log(f"📡 Response status: {response.status_code}", "INFO")
                
                if response.status_code != 200:
                    self.log(f"❌ Failed to fetch reviews: {response.status_code}", "ERROR")
                    return {"error": "Failed to fetch reviews", "status": response.status_code}
                
                try:
                    data = response.json()
                    self.log(f"✅ Reviews response received", "SUCCESS")
                    return data
                except Exception as json_error:
                    self.log(f"⚠️  Invalid JSON response", "WARNING")
                    return {"error": "Invalid response", "status": response.status_code}
                
        except Exception as e:
            self.log(f"❌ Error fetching reviews: {str(e)}", "ERROR")
            return {"error": str(e)}
