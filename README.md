# CafeBae ☕

Find your perfect cafe with a little help from AI.

I built this because I was tired of scrolling through endless cafe listings without knowing which ones were actually worth visiting. CafeBae pulls real-time data from Swiggy and uses AI to help you filter through the noise. There's also a chat feature where you can tell the AI what you're looking for (vegetarian, budget-friendly, highly rated, etc.) and it'll highlight matching cafes for you.

The coolest part? Click any cafe and the AI searches the web for actual reviews and recommendations, so you're not just seeing marketing fluff.

## What it does

- Search cafes in any major Indian city (pulls from Swiggy)
- Chat with an AI to filter by your preferences
- Click a cafe to get AI-researched reviews from the web
- Dark theme because it's 2026 and light mode hurts
- Direct links to order on Swiggy

## Stack

**Frontend:** React, Vite, Tailwind  
**Backend:** Flask, CrewAI, Tavily API  
**Data:** Swiggy's API (unofficial, for learning purposes)

## Setup

You'll need API keys from:
- [KIE.ai](https://kie.ai) - for the AI chat
- [Tavily](https://tavily.com) - for web search (1000 free searches/month)

### Backend

```bash
cd backend
pip install flask flask-cors python-dotenv crewai crewai-tools requests tavily-python

# Create .env file with your keys
echo "KIE_API_KEY=your_key" > .env
echo "TAVILY_API_KEY=your_key" >> .env

python app.py
```

Runs on `http://localhost:3000`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Runs on `http://localhost:5173`

## How to use it

1. Type a city name or click a city tag
2. Browse cafes, scroll to load more
3. Click the floating button to chat with the AI about what you want
4. Click any cafe card to get web-researched reviews and info
5. Hit "Open in Swiggy" to order

The AI chat understands stuff like "vegetarian under ₹300" or "highly rated with good ambiance" and will highlight matching cafes.

## Deployment

Currently deployed:
- Backend: Render (Docker)
- Frontend: Cloudflare Pages

Both are on free tiers. The backend might take 30 seconds to wake up if it's been idle.

## Notes

- This uses Swiggy's unofficial API, so it's for learning/personal use only
- The web search takes 10-20 seconds because it's actually searching multiple sources
- Works best with major cities (Mumbai, Delhi, Bangalore, Pune, etc.)
- Tavily free tier gives you 1000 searches/month

## License

MIT - do whatever you want with it

---

Built this as a weekend project to learn CrewAI and play with AI agents. If you find bugs or have ideas, feel free to open an issue.

