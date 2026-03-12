import { useState, useEffect, useRef } from 'react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

export default function ChatModal({ sessionId, introMessage, onClose, onApprovedCafes, messages, setMessages }) {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    if (introMessage && messages.length === 0) {
      setMessages([{ role: 'assistant', content: introMessage }])
    }
  }, [introMessage, messages.length, setMessages])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    const userMessage = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setLoading(true)

    try {
      const response = await axios.post(`${API_URL}/chat`, {
        message: userMessage,
        session_id: sessionId
      })

      if (response.data.success) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: response.data.response
        }])

        if (response.data.approved_cafes?.length > 0) {
          onApprovedCafes(response.data.approved_cafes)

          // Show notification
          setTimeout(() => {
            showNotification(`Found ${response.data.approved_cafes.length} perfect matches! Check them out below 💕`)
          }, 500)
        }
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Connection error. Please try again.'
      }])
    } finally {
      setLoading(false)
    }
  }

  const showNotification = (message) => {
    const notification = document.createElement('div')
    notification.className = 'fixed top-8 right-8 bg-gradient-to-r from-pink-400 to-rose-400 text-white px-6 py-4 rounded-2xl shadow-2xl z-50 animate-fade-in border-2 border-pink-300'
    notification.innerHTML = `
      <div class="flex items-center gap-3">
        <i class="fas fa-heart text-2xl"></i>
        <span class="font-bold">${message}</span>
      </div>
    `

    document.body.appendChild(notification)

    setTimeout(() => {
      notification.classList.add('opacity-0', 'transition-opacity')
      setTimeout(() => notification.remove(), 300)
    }, 4000)
  }

  const quickActions = [
    { icon: 'leaf', text: 'Vegetarian only', action: 'Show me only vegetarian cafes' },
    { icon: 'star', text: 'Top rated', action: 'I want cafes with 4+ rating' },
    { icon: 'wallet', text: 'Budget friendly', action: 'Show me budget-friendly cafes under ₹300' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-pink-50/95 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col border-4 border-pink-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-pink-200 bg-gradient-to-r from-pink-50 to-purple-50">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-14 h-14 rounded-full overflow-hidden border-3 border-pink-300 shadow-lg">
                <img src="/bae.jpg" alt="Bae" className="w-full h-full object-cover" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-pink-400 rounded-full border-3 border-white animate-pulse"></div>
            </div>
            <div>
              <h3 className="font-bold text-pink-600 text-lg flex items-center gap-2">
                Bae <span className="text-xl">💕</span>
              </h3>
              <p className="text-xs text-pink-400">Your Cafe Bestie</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-pink-100 text-pink-400 hover:text-pink-600 transition-colors"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] px-4 py-3 rounded-2xl ${msg.role === 'user'
                  ? 'bg-gradient-to-r from-pink-400 to-rose-400 text-white shadow-lg'
                  : 'bg-pink-50 text-gray-800 border-2 border-pink-200'
                  }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-pink-50 px-4 py-3 rounded-2xl border-2 border-pink-200">
                <div className="flex gap-2">
                  <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Actions */}
        {messages.length <= 1 && (
          <div className="px-6 pb-4">
            <p className="text-xs text-pink-400 mb-2 font-semibold">Quick actions:</p>
            <div className="flex flex-wrap gap-2">
              {quickActions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setInput(action.action)
                    setTimeout(sendMessage, 100)
                  }}
                  className="px-3 py-2 bg-pink-50 hover:bg-pink-100 border-2 border-pink-200 rounded-lg text-sm text-pink-600 transition-colors flex items-center gap-2"
                >
                  <i className={`fas fa-${action.icon} text-pink-400`}></i>
                  {action.text}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-6 border-t border-pink-200 bg-pink-50/50">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Tell me what you're looking for..."
              className="flex-1 px-4 py-3 bg-white border-2 border-pink-200 rounded-xl text-gray-800 placeholder-pink-300 focus:outline-none focus:border-pink-400 transition-colors"
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="px-6 py-3 bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-semibold transition-all text-white shadow-lg"
            >
              <i className="fas fa-paper-plane"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
