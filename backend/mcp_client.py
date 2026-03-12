import httpx
import json

class MCPClient:
    def __init__(self):
        self.base_url = "https://mcp-server.zomato.com/mcp"
        self.session_id = None
    
    async def initialize(self):
        """Initialize MCP connection"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/initialize",
                json={"protocolVersion": "2024-11-05"}
            )
            if response.status_code == 200:
                data = response.json()
                self.session_id = data.get('sessionId')
                return data
            else:
                raise Exception(f"Failed to initialize MCP: {response.text}")
    
    async def list_tools(self):
        """List available tools from Zomato MCP"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/tools/list",
                json={}
            )
            if response.status_code == 200:
                return response.json()
            else:
                raise Exception(f"Failed to list tools: {response.text}")
    
    async def call_tool(self, tool_name, arguments):
        """Call a specific MCP tool"""
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{self.base_url}/tools/call",
                json={
                    "name": tool_name,
                    "arguments": arguments
                }
            )
            if response.status_code == 200:
                return response.json()
            else:
                raise Exception(f"Failed to call tool: {response.text}")
    
    async def search_restaurants(self, location, cuisine=None, limit=10):
        """Search for restaurants using Zomato MCP"""
        arguments = {
            "location": location,
            "limit": limit
        }
        if cuisine:
            arguments["cuisine"] = cuisine
        
        return await self.call_tool("search_restaurants", arguments)
