import httpx
import json
import asyncio

class GeminiClient:
    def __init__(self, api_key):
        self.api_key = api_key
        self.base_url = "https://api.kie.ai/gemini-2.5-pro/v1/chat/completions"
    
    def search_restaurants(self, location, mcp_client):
        """Use Gemini to process search and call Zomato MCP"""
        return asyncio.run(self._async_search(location, mcp_client))
    
    async def _async_search(self, location, mcp_client):
        """Async implementation of restaurant search"""
        
        # First, initialize MCP and get available tools
        await mcp_client.initialize()
        tools_response = await mcp_client.list_tools()
        
        # Call Zomato MCP directly to search restaurants
        search_result = await mcp_client.search_restaurants(location)
        
        # Parse and format the results
        restaurants = self._parse_restaurant_data(search_result)
        
        return restaurants
    
    def _parse_restaurant_data(self, mcp_response):
        """Parse MCP response and extract restaurant data"""
        restaurants = []
        
        try:
            # The actual structure depends on Zomato MCP response
            # This is a generic parser
            if isinstance(mcp_response, dict):
                content = mcp_response.get('content', [])
                
                if isinstance(content, list) and len(content) > 0:
                    # Try to parse the text content
                    text_content = content[0].get('text', '')
                    
                    # If it's JSON string, parse it
                    try:
                        data = json.loads(text_content)
                        if isinstance(data, list):
                            restaurants = data
                        elif isinstance(data, dict) and 'restaurants' in data:
                            restaurants = data['restaurants']
                    except json.JSONDecodeError:
                        # If not JSON, return raw text
                        restaurants = [{
                            'name': 'Search Results',
                            'description': text_content
                        }]
            
            # Format restaurants for frontend
            formatted = []
            for r in restaurants:
                formatted.append({
                    'name': r.get('name', 'Unknown'),
                    'cuisine': r.get('cuisine', r.get('cuisines', 'Various')),
                    'rating': r.get('rating', r.get('user_rating', {}).get('aggregate_rating', 'N/A')),
                    'address': r.get('address', r.get('location', {}).get('address', 'Address not available')),
                    'priceRange': r.get('price_range', r.get('average_cost_for_two', 'N/A')),
                    'image': r.get('image', r.get('thumb', r.get('featured_image', 'https://via.placeholder.com/300x200?text=No+Image'))),
                    'distance': r.get('distance', 'N/A')
                })
            
            return formatted if formatted else restaurants
            
        except Exception as e:
            print(f"Error parsing restaurant data: {str(e)}")
            return []
