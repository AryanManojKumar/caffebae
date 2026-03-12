import httpx
import json
from typing import List, Dict, Optional
from datetime import datetime

class AIAssistant:
    """
    AI Assistant (Bae) that helps users filter cafes using Gemini 2.5 Pro
    """
    
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://api.kie.ai/gpt-5-2/v1/chat/completions"
        self.conversation_history = []
        
    def log(self, message, level="INFO"):
        colors = {
            "INFO": "\033[96m",
            "SUCCESS": "\033[92m",
            "ERROR": "\033[91m"
        }
        timestamp = datetime.now().strftime("%H:%M:%S")
        color = colors.get(level, "\033[0m")
        print(f"{color}[{timestamp}] [AIAssistant] {message}\033[0m")
    
    async def chat(self, user_message: str, cafes: List[Dict] = None) -> Dict:
        """
        Chat with the AI assistant
        Returns: {response: str, approved_cafes: List[str]} (IDs of approved cafes)
        """
        try:
            self.log(f"💬 User message: {user_message}", "INFO")
            
            # Build context about cafes if provided
            cafe_context = ""
            cafe_list = []
            if cafes:
                cafe_context = "\n\nAvailable cafes:\n"
                for cafe in cafes:
                    cafe_info = f"ID: {cafe['id']}, Name: {cafe['name']}, Cuisine: {cafe['cuisine']}, Rating: {cafe['rating']}, Price: {cafe['priceRange']}"
                    cafe_context += f"- {cafe_info}\n"
                    cafe_list.append(cafe)
            
            # System prompt
            system_prompt = f"""You are "Bae", a sassy AI cafe assistant.

When user shares preferences, CALL the approve_cafes function with matching cafe IDs.

Cafes:{cafe_context}

ALWAYS use the approve_cafes function!"""

            self.conversation_history.append({"role": "user", "content": user_message})
            
            messages = [{"role": "system", "content": system_prompt}] + self.conversation_history
            
            tools = [{
                "type": "function",
                "function": {
                    "name": "approve_cafes",
                    "description": "Approve cafes matching user preferences",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "approved_cafe_ids": {
                                "type": "array",
                                "items": {"type": "string"}
                            },
                            "reason": {"type": "string"}
                        },
                        "required": ["approved_cafe_ids"]
                    }
                }
            }]
            
            self.log(f"🤖 Calling GPT-5-2...", "INFO")
            
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    self.base_url,
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    },
                    json={"messages": messages, "tools": tools, "reasoning_effort": "high"}
                )
                
                self.log(f"📡 Response status: {response.status_code}", "INFO")
                
                if response.status_code != 200:
                    error_text = response.text[:500]
                    self.log(f"❌ API error: {response.status_code} - {error_text}", "ERROR")
                    return {
                        "response": "Oops! My brain's a bit foggy right now. Try again? 😅",
                        "rejected_cafes": []
                    }
                
                data = response.json()
                self.log(f"📦 Response received", "INFO")
                
                message = data['choices'][0]['message']
                self.log(f"💬 Message keys: {message.keys()}", "INFO")
                
                approved_cafes = []
                assistant_message = message.get('content', '')
                
                # Check for tool calls (function calling)
                if message.get('tool_calls'):
                    self.log(f"🔧 Tool calls found: {len(message['tool_calls'])}", "SUCCESS")
                    for tool_call in message['tool_calls']:
                        if tool_call['function']['name'] == 'approve_cafes':
                            try:
                                args = json.loads(tool_call['function']['arguments'])
                                approved_cafes = args.get('approved_cafe_ids', [])
                                reason = args.get('reason', 'Matches your preferences')
                                self.log(f"✅ AI approved {len(approved_cafes)} cafes: {reason}", "SUCCESS")
                                self.log(f"✅ Approved IDs: {approved_cafes}", "SUCCESS")
                            except Exception as e:
                                self.log(f"❌ Error parsing tool call: {str(e)}", "ERROR")
                else:
                    self.log(f"⚠️  NO TOOL CALLS - AI just responded with text", "ERROR")
                
                # Add assistant response to history
                self.conversation_history.append({
                    "role": "assistant",
                    "content": assistant_message
                })
                
                self.log(f"✅ Response: {assistant_message[:100]}...", "SUCCESS")
                
                return {
                    "response": assistant_message,
                    "approved_cafes": approved_cafes
                }
                
        except httpx.TimeoutException as e:
            self.log(f"❌ Timeout error: {str(e)}", "ERROR")
            return {
                "response": "Whoa, that took too long! 😅 Try asking me again?",
                "approved_cafes": []
            }
        except Exception as e:
            self.log(f"❌ Error: {str(e)}", "ERROR")
            import traceback
            self.log(f"Stack trace: {traceback.format_exc()}", "ERROR")
            return {
                "response": "Ugh, something went wrong! 😤 Try asking me again?",
                "approved_cafes": []
            }
    
    async def filter_cafes(self, preferences: Dict, cafes: List[Dict]) -> Dict:
        """
        Filter cafes based on user preferences
        Returns: {approved: List[int], rejected: List[int], reasoning: Dict}
        """
        try:
            self.log(f"🔍 Filtering cafes with preferences: {preferences}", "INFO")
            
            approved = []
            rejected = []
            reasoning = {}
            
            for i, cafe in enumerate(cafes):
                cafe_id = cafe.get('id')
                reasons = []
                should_reject = False
                
                # Check rating preference
                if preferences.get('min_rating'):
                    try:
                        rating = float(cafe.get('rating', 0))
                        min_rating = float(preferences['min_rating'])
                        if rating < min_rating:
                            should_reject = True
                            reasons.append(f"Rating {rating} is below your {min_rating} minimum")
                    except:
                        pass
                
                # Check veg preference
                if preferences.get('veg_only'):
                    cuisine = cafe.get('cuisine', '').lower()
                    if 'non-veg' in cuisine or 'chicken' in cuisine or 'meat' in cuisine:
                        should_reject = True
                        reasons.append("Serves non-veg items")
                
                # Check price preference
                if preferences.get('max_price'):
                    try:
                        price_str = cafe.get('priceRange', '₹0')
                        price = int(''.join(filter(str.isdigit, price_str)))
                        max_price = int(preferences['max_price'])
                        if price > max_price:
                            should_reject = True
                            reasons.append(f"₹{price} exceeds your ₹{max_price} budget")
                    except:
                        pass
                
                # Check cuisine preference
                if preferences.get('cuisine'):
                    cuisine = cafe.get('cuisine', '').lower()
                    pref_cuisine = preferences['cuisine'].lower()
                    if pref_cuisine not in cuisine:
                        should_reject = True
                        reasons.append(f"Doesn't serve {preferences['cuisine']}")
                
                if should_reject:
                    rejected.append(cafe_id)
                    reasoning[cafe_id] = reasons
                else:
                    approved.append(cafe_id)
            
            self.log(f"✅ Approved: {len(approved)}, Rejected: {len(rejected)}", "SUCCESS")
            
            return {
                "approved": approved,
                "rejected": rejected,
                "reasoning": reasoning
            }
            
        except Exception as e:
            self.log(f"❌ Error filtering: {str(e)}", "ERROR")
            return {
                "approved": [c.get('id') for c in cafes],
                "rejected": [],
                "reasoning": {}
            }
    
    def reset_conversation(self):
        """Reset conversation history"""
        self.conversation_history = []
        self.log("🔄 Conversation reset", "INFO")
    
    async def get_intro_message(self, cafe_count: int) -> str:
        """Get the initial greeting message"""
        intros = [
            f"Whoa whoa whoa! 🛑 Hold up there! You weren't about to pick from {cafe_count} cafes without asking me first, were you? 😏",
            f"Excuse me! 🙋‍♀️ I see {cafe_count} cafes here and you're just gonna pick randomly? Let me help you out!",
            f"Hey hey! 👋 Before you click on any of these {cafe_count} cafes, let's chat! I know what's good around here 😎",
            f"Stop right there! ✋ {cafe_count} cafes and you think you can choose without my expert opinion? Let's talk preferences first!"
        ]
        
        import random
        return random.choice(intros)
