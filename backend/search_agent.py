from crewai import Agent, Task, Crew, Process, LLM
from crewai.tools import BaseTool
from typing import Type, Dict
from pydantic import BaseModel, Field
import os
from datetime import datetime

class TavilySearchInput(BaseModel):
    """Input schema for Tavily Search"""
    query: str = Field(..., description="Search query to find information about the cafe")

class TavilySearchTool(BaseTool):
    name: str = "Search Web"
    description: str = "Search the web using Tavily to find real user reviews, ratings, and recommendations about cafes"
    args_schema: Type[BaseModel] = TavilySearchInput
    
    def _run(self, query: str) -> str:
        """Execute web search using Tavily"""
        try:
            from tavily import TavilyClient
            
            # Initialize Tavily client
            tavily_api_key = os.getenv('TAVILY_API_KEY')
            if not tavily_api_key:
                return "Tavily API key not configured. Please add TAVILY_API_KEY to .env file"
            
            client = TavilyClient(api_key=tavily_api_key)
            
            # Perform search
            print(f"\033[96m[Tavily] 🔍 Searching: {query}\033[0m")
            response = client.search(
                query=query,
                search_depth="advanced",
                max_results=5
            )
            
            # Format results
            results = []
            for result in response.get('results', []):
                results.append(f"- {result.get('title', 'No title')}\n  {result.get('content', 'No content')}\n  Source: {result.get('url', 'No URL')}")
            
            formatted_results = "\n\n".join(results)
            print(f"\033[92m[Tavily] ✅ Found {len(results)} results\033[0m")
            
            return formatted_results if formatted_results else "No results found"
            
        except ImportError:
            return "Tavily library not installed. Run: pip install tavily-python"
        except Exception as e:
            print(f"\033[91m[Tavily] ❌ Error: {str(e)}\033[0m")
            return f"Search error: {str(e)}"


class CafeSearchAgent:
    """
    AI agent that searches the web for cafe reviews and recommendations
    """
    
    def __init__(self, api_key: str):
        self.api_key = api_key
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
        print(f"{color}[{timestamp}] [SearchAgent] {message}\033[0m")
    
    def search_cafe_info(self, cafe_name: str, location: str) -> Dict:
        """
        Search for comprehensive information about a cafe
        Returns: {response: str, sources: List[str]}
        """
        try:
            self.log(f"🔍 Searching for: {cafe_name} in {location}", "INFO")
            
            # Create search tool
            search_tool = TavilySearchTool()
            
            # Create LLM instance
            llm = LLM(
                model="openai/gemini-3-flash",
                api_key=self.api_key,
                base_url="https://api.kie.ai/gemini-3-flash/v1"
            )
            
            # Create search agent
            search_agent = Agent(
                role="Cafe Research Specialist",
                goal="Find authentic user reviews, ratings, and recommendations about cafes from the web",
                backstory="""You are Bae's research assistant. When users want to know about a cafe,
                you search the web for real reviews, popular menu items, what people love about it,
                and any important things to know. You're thorough but concise.""",
                tools=[search_tool],
                verbose=True,
                allow_delegation=False,
                max_iter=10,
                llm=llm
            )
            
            # Create search task
            task = Task(
                description=f"""Search for information about "{cafe_name}" in {location}.

Find:
1. What real users say about this cafe (reviews, ratings)
2. Most popular/recommended menu items
3. What makes this cafe special or unique
4. Any important things to know (ambiance, service, pricing)
5. Overall recommendation

Use the "Search Web" tool to find this information.
Then summarize it in a friendly, conversational way as if you're Bae talking to a friend.""",
                agent=search_agent,
                expected_output="A friendly summary of what you found about the cafe with real user insights"
            )
            
            # Run the crew
            crew = Crew(
                agents=[search_agent],
                tasks=[task],
                process=Process.sequential,
                verbose=True
            )
            
            self.log("🚀 Starting web search...", "INFO")
            result = crew.kickoff()
            
            self.log("✅ Search completed", "SUCCESS")
            
            return {
                "response": str(result),
                "success": True
            }
            
        except Exception as e:
            self.log(f"❌ Error: {str(e)}", "ERROR")
            import traceback
            self.log(f"Stack trace: {traceback.format_exc()}", "ERROR")
            
            return {
                "response": f"Oops! I had trouble searching for info about {cafe_name}. But I'm sure it's great! 😊",
                "success": False,
                "error": str(e)
            }
    
    def get_swiggy_link(self, cafe_name: str, location: str, restaurant_id: str = None) -> str:
        """Generate Swiggy link for the restaurant"""
        # Swiggy URL format: https://www.swiggy.com/restaurants/{slug}-{location}-{id}
        # We'll create a search URL as fallback
        
        if restaurant_id:
            # Try to construct direct link (may not work without proper slug)
            slug = cafe_name.lower().replace(' ', '-').replace('&', 'and')
            location_slug = location.lower().replace(' ', '-')
            return f"https://www.swiggy.com/restaurants/{slug}-{location_slug}-{restaurant_id}"
        else:
            # Fallback to search
            search_query = cafe_name.replace(' ', '%20')
            return f"https://www.swiggy.com/search?query={search_query}"
