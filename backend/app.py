from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from swiggy_client import SwiggyClient
from crew_assistant import CrewAIAssistant
from search_agent import CafeSearchAgent
import asyncio
from datetime import datetime
import os

load_dotenv()

app = Flask(__name__)
CORS(app, origins=[
    'http://localhost:5173', 
    'http://localhost:3000',
    'https://caffebae.pages.dev',
    'https://*.caffebae.pages.dev'
])

# Initialize clients
swiggy_client = SwiggyClient()
ai_assistant = CrewAIAssistant(api_key=os.getenv('KIE_API_KEY'))
search_agent = CafeSearchAgent(api_key=os.getenv('KIE_API_KEY'))

# Store cafe data temporarily (in production, use Redis or database)
cafe_cache = {}

# Color codes for terminal
class Colors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'

def log_info(message):
    timestamp = datetime.now().strftime("%H:%M:%S")
    print(f"{Colors.OKCYAN}[{timestamp}] ℹ️  {message}{Colors.ENDC}")

def log_success(message):
    timestamp = datetime.now().strftime("%H:%M:%S")
    print(f"{Colors.OKGREEN}[{timestamp}] ✅ {message}{Colors.ENDC}")

def log_error(message):
    timestamp = datetime.now().strftime("%H:%M:%S")
    print(f"{Colors.FAIL}[{timestamp}] ❌ {message}{Colors.ENDC}")

def log_request(endpoint, data):
    timestamp = datetime.now().strftime("%H:%M:%S")
    print(f"\n{Colors.HEADER}{'='*60}{Colors.ENDC}")
    print(f"{Colors.BOLD}[{timestamp}] 📥 INCOMING REQUEST{Colors.ENDC}")
    print(f"{Colors.OKBLUE}Endpoint: {endpoint}{Colors.ENDC}")
    print(f"{Colors.OKBLUE}Data: {data}{Colors.ENDC}")
    print(f"{Colors.HEADER}{'='*60}{Colors.ENDC}\n")

def log_response(status, data, count=None):
    timestamp = datetime.now().strftime("%H:%M:%S")
    print(f"\n{Colors.HEADER}{'='*60}{Colors.ENDC}")
    print(f"{Colors.BOLD}[{timestamp}] 📤 OUTGOING RESPONSE{Colors.ENDC}")
    print(f"{Colors.OKGREEN}Status: {status}{Colors.ENDC}")
    if count is not None:
        print(f"{Colors.OKGREEN}Results Count: {count}{Colors.ENDC}")
    print(f"{Colors.OKGREEN}Data Preview: {str(data)[:200]}...{Colors.ENDC}")
    print(f"{Colors.HEADER}{'='*60}{Colors.ENDC}\n")

@app.route('/api/search', methods=['POST'])
def search_restaurants():
    try:
        data = request.json
        location = data.get('location', '')
        keyword = data.get('keyword', 'cafe')
        page = data.get('page', 0)
        session_id = data.get('session_id', 'default')
        
        log_request('/api/search', {
            'location': location,
            'keyword': keyword,
            'page': page
        })
        
        if not location:
            log_error('Location is required')
            return jsonify({'error': 'Location is required'}), 400
        
        log_info(f"Searching for '{keyword}' in {location} (Page {page})...")
        
        # Search restaurants using Swiggy's unofficial API
        results = asyncio.run(swiggy_client.search_restaurants(location, keyword, page))
        
        restaurants = results.get('restaurants', [])
        has_more = results.get('hasMore', False)
        
        # Cache cafes for this session
        if session_id not in cafe_cache:
            cafe_cache[session_id] = []
        cafe_cache[session_id].extend(restaurants)
        
        log_success(f"Found {len(restaurants)} cafes")
        log_info(f"Has more results: {has_more}")
        
        # Get intro message from AI if first page
        intro_message = None
        if page == 0 and len(restaurants) > 0:
            intro_message = asyncio.run(ai_assistant.get_intro_message(len(restaurants)))
        
        response_data = {
            'success': True,
            'restaurants': restaurants,
            'hasMore': has_more,
            'page': results.get('page', 0),
            'intro_message': intro_message
        }
        
        log_response('200 OK', response_data, len(restaurants))
        
        return jsonify(response_data)
    
    except Exception as e:
        log_error(f"Error: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/restaurant/<restaurant_id>/menu', methods=['GET'])
def get_restaurant_menu(restaurant_id):
    try:
        session_id = request.args.get('session_id', 'default')
        
        log_request(f'/api/restaurant/{restaurant_id}/menu', {
            'restaurant_id': restaurant_id,
            'session_id': session_id
        })
        
        # Get restaurant from cache to get coordinates
        cafes = cafe_cache.get(session_id, [])
        restaurant = next((c for c in cafes if str(c['id']) == str(restaurant_id)), None)
        
        if not restaurant:
            log_error('Restaurant not found in cache')
            return jsonify({'error': 'Restaurant not found'}), 404
        
        lat = restaurant.get('lat')
        lng = restaurant.get('lng')
        
        if not lat or not lng:
            log_error('Restaurant coordinates not available')
            return jsonify({'error': 'Restaurant coordinates not available'}), 400
        
        log_info(f"Fetching menu for {restaurant['name']}...")
        
        details = asyncio.run(swiggy_client.get_restaurant_menu(restaurant_id, lat, lng))
        
        log_success(f"Menu fetched successfully")
        
        return jsonify({
            'success': True,
            'restaurant': restaurant,
            'menu': details
        })
    
    except Exception as e:
        log_error(f"Error: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/chat', methods=['POST'])
def chat_with_assistant():
    try:
        data = request.json
        message = data.get('message', '')
        session_id = data.get('session_id', 'default')
        
        log_request('/api/chat', {
            'message': message,
            'session_id': session_id
        })
        
        if not message:
            return jsonify({'error': 'Message is required'}), 400
        
        # Get cafes for this session
        cafes = cafe_cache.get(session_id, [])
        
        log_info(f"💬 Chat message: {message}")
        log_info(f"📊 Available cafes: {len(cafes)}")
        
        # Get AI response using CrewAI
        result = ai_assistant.chat(message, cafes)
        
        log_success(f"AI responded")
        if result.get('approved_cafes'):
            log_info(f"✅ Approved {len(result['approved_cafes'])} cafes: {result['approved_cafes']}")
        
        return jsonify({
            'success': True,
            'response': result['response'],
            'approved_cafes': result.get('approved_cafes', [])
        })
    
    except Exception as e:
        log_error(f"Error: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/filter', methods=['POST'])
def filter_cafes():
    try:
        data = request.json
        preferences = data.get('preferences', {})
        session_id = data.get('session_id', 'default')
        
        log_request('/api/filter', {
            'preferences': preferences,
            'session_id': session_id
        })
        
        # Get cafes for this session
        cafes = cafe_cache.get(session_id, [])
        
        if not cafes:
            return jsonify({'error': 'No cafes to filter'}), 400
        
        log_info(f"🔍 Filtering {len(cafes)} cafes...")
        
        # Filter cafes based on preferences
        result = asyncio.run(ai_assistant.filter_cafes(preferences, cafes))
        
        log_success(f"Filtered: {len(result['approved'])} approved, {len(result['rejected'])} rejected")
        
        return jsonify({
            'success': True,
            'approved': result['approved'],
            'rejected': result['rejected'],
            'reasoning': result['reasoning']
        })
    
    except Exception as e:
        log_error(f"Error: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/reset-chat', methods=['POST'])
def reset_chat():
    try:
        data = request.json
        session_id = data.get('session_id', 'default')
        
        # Reset AI conversation
        ai_assistant.reset_conversation()
        
        # Clear cafe cache for this session
        if session_id in cafe_cache:
            del cafe_cache[session_id]
        
        log_info(f"🔄 Chat reset for session {session_id}")
        
        return jsonify({
            'success': True,
            'message': 'Chat reset successfully'
        })
    
    except Exception as e:
        log_error(f"Error: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/restaurant/<restaurant_id>', methods=['POST'])
def get_restaurant_details(restaurant_id):
    """Get detailed restaurant info including menu"""
    try:
        data = request.json
        lat = data.get('lat', 19.0760)
        lng = data.get('lng', 72.8777)
        
        log_request(f'/api/restaurant/{restaurant_id}', data)
        log_info(f"📋 Fetching details for restaurant {restaurant_id}")
        
        # Fetch menu from Swiggy
        menu_data = asyncio.run(swiggy_client.get_restaurant_menu(restaurant_id, lat, lng))
        
        # Even if menu fetch fails, return success with empty menu
        if 'error' in menu_data:
            log_error(f"Menu fetch issue: {menu_data.get('error')} (Status: {menu_data.get('status', 'unknown')})")
            log_info(f"⚠️  Returning restaurant info without menu")
            
            return jsonify({
                'success': True,
                'restaurant': {},
                'menu': [],
                'categories': [],
                'menuAvailable': False,
                'message': 'Menu temporarily unavailable'
            })
        
        # Parse menu data
        parsed_data = parse_menu_data(menu_data)
        parsed_data['menuAvailable'] = len(parsed_data.get('menu', [])) > 0
        
        log_success(f"✅ Restaurant details fetched - {len(parsed_data.get('menu', []))} menu items")
        
        return jsonify({
            'success': True,
            **parsed_data
        })
        
    except Exception as e:
        log_error(f"Error: {str(e)}")
        import traceback
        log_error(traceback.format_exc())
        
        # Return success with empty data rather than error
        return jsonify({
            'success': True,
            'restaurant': {},
            'menu': [],
            'categories': [],
            'menuAvailable': False,
            'message': 'Unable to load menu'
        })

def parse_menu_data(data):
    """Parse Swiggy menu response"""
    try:
        cards = data.get('data', {}).get('cards', [])
        
        restaurant_info = {}
        menu_items = []
        categories = []
        
        for card in cards:
            card_data = card.get('card', {}).get('card', {})
            
            # Restaurant info
            if 'info' in card_data:
                info = card_data['info']
                restaurant_info = {
                    'name': info.get('name'),
                    'cuisines': info.get('cuisines', []),
                    'costForTwo': info.get('costForTwo'),
                    'avgRating': info.get('avgRating'),
                    'totalRatings': info.get('totalRatingsString'),
                    'deliveryTime': info.get('sla', {}).get('deliveryTime'),
                    'address': info.get('areaName'),
                    'city': info.get('city')
                }
            
            # Menu categories
            if 'groupedCard' in card_data:
                grouped_cards = card_data.get('groupedCard', {}).get('cardGroupMap', {}).get('REGULAR', {}).get('cards', [])
                
                for menu_card in grouped_cards:
                    menu_card_data = menu_card.get('card', {}).get('card', {})
                    
                    if 'itemCards' in menu_card_data:
                        category_name = menu_card_data.get('title', 'Menu')
                        categories.append(category_name)
                        
                        for item_card in menu_card_data.get('itemCards', []):
                            item_info = item_card.get('card', {}).get('info', {})
                            
                            menu_item = {
                                'id': item_info.get('id'),
                                'name': item_info.get('name'),
                                'category': category_name,
                                'price': item_info.get('price', item_info.get('defaultPrice', 0)) / 100,
                                'description': item_info.get('description', ''),
                                'isVeg': item_info.get('isVeg', False),
                                'rating': item_info.get('ratings', {}).get('aggregatedRating', {}).get('rating'),
                                'image': swiggy_client.get_image_url(item_info.get('imageId'))
                            }
                            
                            menu_items.append(menu_item)
        
        return {
            'restaurant': restaurant_info,
            'menu': menu_items,
            'categories': list(set(categories))
        }
        
    except Exception as e:
        log_error(f"Error parsing menu: {str(e)}")
        return {
            'restaurant': {},
            'menu': [],
            'categories': []
        }

@app.route('/api/cafe/research', methods=['POST'])
def research_cafe():
    """Research a cafe using web search"""
    try:
        data = request.json
        cafe_name = data.get('cafe_name')
        location = data.get('location', 'Mumbai')
        restaurant_id = data.get('restaurant_id')
        
        if not cafe_name:
            return jsonify({
                'success': False,
                'error': 'Cafe name is required'
            }), 400
        
        log_request('/api/cafe/research', data)
        log_info(f"🔍 Researching: {cafe_name}")
        
        # Search for cafe information
        result = search_agent.search_cafe_info(cafe_name, location)
        
        # Generate Swiggy link
        swiggy_link = search_agent.get_swiggy_link(cafe_name, location, restaurant_id)
        
        log_success(f"✅ Research completed for {cafe_name}")
        
        return jsonify({
            'success': True,
            'response': result.get('response'),
            'swiggy_link': swiggy_link
        })
        
    except Exception as e:
        log_error(f"Error: {str(e)}")
        import traceback
        log_error(traceback.format_exc())
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/health', methods=['GET'])
def health_check():
    log_info('Health check requested')
    return jsonify({'status': 'healthy'})

@app.route('/api/test/offers/<restaurant_id>', methods=['POST'])
def test_offers(restaurant_id):
    """Test endpoint to check if offers API works"""
    try:
        data = request.json
        lat = data.get('lat', 19.0760)
        lng = data.get('lng', 72.8777)
        
        log_info(f"🧪 Testing offers endpoint for restaurant {restaurant_id}")
        
        offers_data = asyncio.run(swiggy_client.get_restaurant_offers(restaurant_id, lat, lng))
        
        return jsonify({
            'success': 'error' not in offers_data,
            'data': offers_data,
            'message': 'Check console logs for details'
        })
        
    except Exception as e:
        log_error(f"Error: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/test/reviews/<restaurant_id>', methods=['GET'])
def test_reviews(restaurant_id):
    """Test endpoint to check if reviews API works"""
    try:
        log_info(f"🧪 Testing reviews endpoint for restaurant {restaurant_id}")
        
        reviews_data = asyncio.run(swiggy_client.get_restaurant_reviews(restaurant_id))
        
        return jsonify({
            'success': 'error' not in reviews_data,
            'data': reviews_data,
            'message': 'Check console logs for details'
        })
        
    except Exception as e:
        log_error(f"Error: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    print(f"\n{Colors.BOLD}{Colors.OKGREEN}{'='*60}{Colors.ENDC}")
    print(f"{Colors.BOLD}{Colors.OKGREEN}🍽️  CafeBae Backend Server Starting...{Colors.ENDC}")
    print(f"{Colors.BOLD}{Colors.OKGREEN}{'='*60}{Colors.ENDC}\n")
    
    # Get port from environment variable (Render sets this)
    port = int(os.getenv('PORT', 3000))
    
    print(f"{Colors.OKCYAN}Server: http://0.0.0.0:{port}{Colors.ENDC}")
    print(f"{Colors.OKCYAN}Health: http://0.0.0.0:{port}/health{Colors.ENDC}")
    print(f"{Colors.WARNING}Using Swiggy's unofficial API (for learning only){Colors.ENDC}\n")
    
    # Bind to 0.0.0.0 for Docker/Render
    app.run(host='0.0.0.0', debug=False, port=port)
