from crewai import Agent, Task, Crew, Process, LLM
from crewai.tools import BaseTool
from typing import List, Dict, Type
from pydantic import BaseModel, Field
from datetime import datetime
import os

# Load agent instructions
INSTRUCTIONS_PATH = os.path.join(os.path.dirname(__file__), 'agent_instructions.md')
with open(INSTRUCTIONS_PATH, 'r', encoding='utf-8') as f:
    AGENT_INSTRUCTIONS = f.read()

# Global storage for cafes
current_cafes = []
approved_cafe_ids = []


class ApproveCafesInput(BaseModel):
    """Input schema for ApproveCafesTool"""
    cafe_ids: str = Field(..., description="Comma-separated cafe IDs to approve (e.g., '12345,67890,11111')")
    reason: str = Field(default="Matches preferences", description="Brief reason for approval")


class ApproveCafesTool(BaseTool):
    name: str = "Approve Cafes"
    description: str = """REQUIRED TOOL: Use this to approve cafes matching user preferences. 
    Pass comma-separated cafe IDs (e.g., '12345,67890'). 
    MUST be called when user mentions ANY preference like veg, pizza, rating, budget, etc."""
    args_schema: Type[BaseModel] = ApproveCafesInput
    
    def _run(self, cafe_ids: str, reason: str = "Matches preferences") -> str:
        """Execute the tool"""
        global approved_cafe_ids
        
        ids_list = [id.strip() for id in cafe_ids.split(',') if id.strip()]
        approved_cafe_ids = ids_list
        
        print(f"\033[92m[CrewAI Tool] ✅ Approved {len(ids_list)} cafes: {reason}\033[0m")
        print(f"\033[92m[CrewAI Tool] ✅ IDs: {ids_list}\033[0m")
        
        return f"Successfully approved {len(ids_list)} cafes: {ids_list}"


class CrewAIAssistant:
    """
    CrewAI-based cafe assistant that reliably uses tools
    """
    
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.conversation_history = []
        # Set environment variable for CrewAI
        os.environ["OPENAI_API_KEY"] = api_key
        os.environ["OPENAI_API_BASE"] = "https://api.kie.ai/gemini-3-flash/v1"
        os.environ["OPENAI_MODEL_NAME"] = "openai/gemini-3-flash"
        
    def log(self, message, level="INFO"):
        colors = {
            "INFO": "\033[96m",
            "SUCCESS": "\033[92m",
            "ERROR": "\033[91m"
        }
        timestamp = datetime.now().strftime("%H:%M:%S")
        color = colors.get(level, "\033[0m")
        print(f"{color}[{timestamp}] [CrewAI] {message}\033[0m")
    
    def chat(self, user_message: str, cafes: List[Dict] = None) -> Dict:
        """
        Chat with CrewAI assistant
        Returns: {response: str, approved_cafes: List[str]}
        """
        try:
            global current_cafes, approved_cafe_ids
            current_cafes = cafes or []
            approved_cafe_ids = []
            
            self.log(f"💬 User message: {user_message}", "INFO")
            self.log(f"📊 Available cafes: {len(current_cafes)}", "INFO")
            
            # Build cafe context
            cafe_context = ""
            if current_cafes:
                cafe_context = "\n\n## Available Cafes\n"
                for cafe in current_cafes:
                    cafe_context += f"- **ID: {cafe['id']}** | {cafe['name']} | {cafe['cuisine']} | Rating: {cafe['rating']} | {cafe['priceRange']}\n"
            
            # Build conversation history
            history_context = ""
            if self.conversation_history:
                history_context = "\n\n## Previous Conversation\n"
                for msg in self.conversation_history[-4:]:
                    history_context += f"**{msg['role'].title()}**: {msg['content']}\n"
            
            # Add to history
            self.conversation_history.append({"role": "user", "content": user_message})
            
            # Create LLM instance with explicit configuration
            llm = LLM(
                model="openai/gemini-3-flash",
                api_key=self.api_key,
                base_url="https://api.kie.ai/gemini-3-flash/v1"
            )
            
            # Create the Bae agent with detailed instructions
            bae_agent = Agent(
                role="Cafe Recommendation Expert - Bae",
                goal="Help users find perfect cafes by identifying matching cafes and returning their IDs in a specific format",
                backstory=f"""{AGENT_INSTRUCTIONS}

You are currently helping a user find cafes. When users mention preferences, you MUST respond in the ACTION format specified in your task.""",
                verbose=True,
                allow_delegation=False,
                max_iter=15,
                llm=llm
            )
            
            # Create the task
            task = Task(
                description=f"""## Current User Message
"{user_message}"
{history_context}
{cafe_context}

## CRITICAL INSTRUCTIONS
You MUST analyze if this message contains food/preference keywords (chocolate, pizza, ice cream, veg, cheap, rating, etc.)

If YES - You MUST respond in this EXACT format:
ACTION: APPROVE_CAFES
IDS: [comma-separated cafe IDs that match]
MESSAGE: [your friendly response]

If NO (just greeting) - Respond normally.

Example for "i like chocolate":
ACTION: APPROVE_CAFES
IDS: 101657,754966,850492,413816,355344
MESSAGE: Ooh chocolate! 🍫 Found 5 sweet spots for you!""",
                agent=bae_agent,
                expected_output="Either ACTION: APPROVE_CAFES with IDs and message, or a friendly greeting"
            )
            
            # Create and run the crew
            crew = Crew(
                agents=[bae_agent],
                tasks=[task],
                process=Process.sequential,
                verbose=True
            )
            
            self.log(f"🚀 Running CrewAI...", "INFO")
            result = crew.kickoff()
            
            self.log(f"✅ CrewAI completed", "SUCCESS")
            
            # Parse the response for ACTION format
            result_str = str(result)
            import re
            
            # Check if response contains ACTION: APPROVE_CAFES
            if "ACTION: APPROVE_CAFES" in result_str:
                # Extract IDs
                ids_match = re.search(r'IDS:\s*([^\n]+)', result_str)
                if ids_match:
                    ids_str = ids_match.group(1).strip()
                    approved_cafe_ids = [id.strip() for id in ids_str.split(',') if id.strip()]
                    self.log(f"✅ Extracted approved cafes: {approved_cafe_ids}", "SUCCESS")
                
                # Extract message
                msg_match = re.search(r'MESSAGE:\s*(.+)', result_str, re.DOTALL)
                if msg_match:
                    result_str = msg_match.group(1).strip()
                else:
                    # Remove the ACTION and IDS lines
                    result_str = re.sub(r'ACTION:.*?\n', '', result_str)
                    result_str = re.sub(r'IDS:.*?\n', '', result_str)
                    result_str = re.sub(r'MESSAGE:\s*', '', result_str).strip()
            
            self.log(f"✅ Approved cafes: {approved_cafe_ids}", "SUCCESS")
            
            # Add assistant response to history
            self.conversation_history.append({"role": "assistant", "content": result_str})
            
            return {
                "response": result_str,
                "approved_cafes": approved_cafe_ids
            }
            
        except Exception as e:
            self.log(f"❌ Error: {str(e)}", "ERROR")
            import traceback
            self.log(f"Stack trace: {traceback.format_exc()}", "ERROR")
            return {
                "response": "Oops! Something went wrong 😅",
                "approved_cafes": []
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
        ]
        
        import random
        return random.choice(intros)
