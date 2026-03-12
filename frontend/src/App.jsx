import { useState, useEffect } from 'react'
import axios from 'axios'
import Header from './components/Header'
import SearchBar from './components/SearchBar'
import CafeGrid from './components/CafeGrid'
import ChatModal from './components/ChatModal'
import Assistant from './components/Assistant'
import CafeChatPage from './components/CafeChatPage'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

function App() {
  const [cafes, setCafes] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [location, setLocation] = useState('')
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [sessionId] = useState(`session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`)
  const [approvedCafes, setApprovedCafes] = useState(new Set())
  const [showChat, setShowChat] = useState(false)
  const [showAssistant, setShowAssistant] = useState(false)
  const [introMessage, setIntroMessage] = useState('')
  const [chatMessages, setChatMessages] = useState([])
  const [selectedCafe, setSelectedCafe] = useState(null)

  const searchCafes = async (newSearch = true) => {
    if (newSearch && !location.trim()) {
      setError('Please enter a city name')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await axios.post(`${API_URL}/search`, {
        location: newSearch ? location : location,
        keyword: 'cafe',
        page: newSearch ? 0 : page,
        session_id: sessionId
      })

      if (response.data.success) {
        if (newSearch) {
          setCafes(response.data.restaurants)
          setPage(0)
          setApprovedCafes(new Set())
          setShowAssistant(false)
          
          if (response.data.intro_message) {
            setIntroMessage(response.data.intro_message)
            setTimeout(() => setShowAssistant(true), 1000)
          }
        } else {
          setCafes(prev => [...prev, ...response.data.restaurants])
        }
        
        setHasMore(response.data.hasMore)
      } else {
        setError(response.data.error || 'No cafes found')
      }
    } catch (err) {
      setError('Failed to search cafes. Make sure the backend is running.')
    } finally {
      setLoading(false)
    }
  }

  const loadMore = () => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1)
    }
  }

  useEffect(() => {
    if (page > 0) {
      searchCafes(false)
    }
  }, [page])

  const handleCafeClick = (cafe) => {
    if (!showAssistant && cafes.length > 0) {
      setShowAssistant(true)
      setShowChat(true)
    } else if (showAssistant) {
      setSelectedCafe(cafe)
    }
  }

  return (
    <div className="min-h-screen bg-dark-900">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <SearchBar 
          location={location}
          setLocation={setLocation}
          onSearch={() => searchCafes(true)}
          loading={loading}
        />

        {error && (
          <div className="mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
            {error}
          </div>
        )}

        <CafeGrid 
          cafes={cafes}
          approvedCafes={approvedCafes}
          onCafeClick={handleCafeClick}
          loading={loading}
          hasMore={hasMore}
          onLoadMore={loadMore}
        />
      </main>

      {showAssistant && (
        <Assistant 
          onOpenChat={() => setShowChat(true)}
        />
      )}

      {showChat && (
        <ChatModal
          sessionId={sessionId}
          introMessage={introMessage}
          onClose={() => setShowChat(false)}
          onApprovedCafes={(ids) => setApprovedCafes(new Set(ids))}
          messages={chatMessages}
          setMessages={setChatMessages}
        />
      )}

      {selectedCafe && (
        <CafeChatPage
          cafe={selectedCafe}
          location={location}
          onClose={() => setSelectedCafe(null)}
        />
      )}
    </div>
  )
}

export default App
