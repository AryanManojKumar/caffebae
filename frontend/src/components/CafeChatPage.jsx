import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import ReactMarkdown from 'react-markdown'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

export default function CafeChatPage({ cafe, location, onClose }) {
  const [loading, setLoading] = useState(true)
  const [response, setResponse] = useState('')
  const [swiggyLink, setSwiggyLink] = useState('')
  const messagesEndRef = useRef(null)

  useEffect(() => {
    fetchCafeInfo()
  }, [cafe.id])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [response])

  const fetchCafeInfo = async () => {
    try {
      setLoading(true)
      const result = await axios.post(`${API_URL}/cafe/research`, {
        cafe_name: cafe.name,
        location: location || 'Mumbai',
        restaurant_id: cafe.id
      })

      if (result.data.success) {
        setResponse(result.data.response)
        setSwiggyLink(result.data.swiggy_link)
      }
    } catch (error) {
      console.error('Error fetching cafe info:', error)
      setResponse("Oops! I had trouble finding info about this cafe. But I'm sure it's amazing! 😊")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-dark-900 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-dark-800/95 backdrop-blur-xl border-b border-pink-900/30">
        <div className="container mx-auto px-4 py-4 max-w-4xl">
          <div className="flex items-center justify-between">
            <button
              onClick={onClose}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <i className="fas fa-arrow-left"></i>
              <span>Back</span>
            </button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full overflow-hidden border-3 border-pink-300 shadow-lg">
                <img src="/bae.jpg" alt="Bae" className="w-full h-full object-cover" />
              </div>
              <div>
                <h3 className="font-bold text-pink-600 flex items-center gap-1">Bae <span>💕</span></h3>
                <p className="text-xs text-pink-400">Researching for you...</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Cafe Header */}
        <div className="mb-8">
          <div className="relative h-64 rounded-2xl overflow-hidden mb-6">
            <img
              src={cafe.image}
              alt={cafe.name}
              className="w-full h-full object-cover"
              onError={(e) => e.target.src = 'https://via.placeholder.com/800x400?text=No+Image'}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
            <div className="absolute bottom-6 left-6 right-6">
              <h1 className="text-3xl font-bold text-white mb-2">{cafe.name}</h1>
              <div className="flex items-center gap-4 flex-wrap">
                {cafe.rating !== 'N/A' && (
                  <div className="flex items-center gap-2 bg-green-500 text-white px-3 py-1.5 rounded-lg font-bold text-sm">
                    <i className="fas fa-star"></i>
                    <span>{cafe.rating}</span>
                  </div>
                )}
                <span className="text-gray-300 text-sm">{cafe.cuisine}</span>
                <span className="text-purple-400 font-bold text-sm">{cafe.priceRange}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="space-y-6">
          {/* User's implicit question */}
          <div className="flex justify-end">
            <div className="max-w-[80%] px-6 py-4 rounded-2xl bg-gradient-to-r from-pink-400 to-rose-400 text-white shadow-lg">
              Tell me about {cafe.name}! What do people say about it?
            </div>
          </div>

          {/* Bae's response */}
          {loading ? (
            <div className="flex justify-start">
              <div className="max-w-[85%] px-6 py-4 rounded-2xl bg-pink-50 border-2 border-pink-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-pink-300">
                    <img src="/bae.jpg" alt="Bae" className="w-full h-full object-cover" />
                  </div>
                  <span className="text-pink-600 font-semibold">Bae is researching...</span>
                </div>
                <div className="flex gap-2">
                  <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
                <p className="text-sm text-pink-400 mt-3">
                  Searching the web for real reviews and recommendations...
                </p>
              </div>
            </div>
          ) : (
            <div className="flex justify-start">
              <div className="max-w-[85%] px-6 py-4 rounded-2xl bg-pink-50 text-gray-800 border-2 border-pink-200 shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-pink-300">
                    <img src="/bae.jpg" alt="Bae" className="w-full h-full object-cover" />
                  </div>
                  <span className="text-pink-600 font-semibold">Bae</span>
                </div>
                <div className="prose prose-sm prose-pink max-w-none">
                  <ReactMarkdown
                    components={{
                      h1: ({node, ...props}) => <h1 className="text-2xl font-bold text-pink-600 mb-4 mt-6" {...props} />,
                      h2: ({node, ...props}) => <h2 className="text-xl font-bold text-pink-500 mb-3 mt-5" {...props} />,
                      h3: ({node, ...props}) => <h3 className="text-lg font-semibold text-gray-800 mb-2 mt-4" {...props} />,
                      p: ({node, ...props}) => <p className="text-gray-700 mb-3 leading-relaxed" {...props} />,
                      ul: ({node, ...props}) => <ul className="list-disc list-inside mb-3 space-y-1" {...props} />,
                      ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-3 space-y-1" {...props} />,
                      li: ({node, ...props}) => <li className="text-gray-700" {...props} />,
                      strong: ({node, ...props}) => <strong className="font-bold text-pink-600" {...props} />,
                      em: ({node, ...props}) => <em className="italic text-gray-600" {...props} />,
                      blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-pink-300 pl-4 italic text-gray-600 my-3" {...props} />,
                      code: ({node, inline, ...props}) => 
                        inline 
                          ? <code className="bg-pink-100 text-pink-700 px-1 py-0.5 rounded text-sm" {...props} />
                          : <code className="block bg-gray-100 p-3 rounded-lg text-sm my-2" {...props} />,
                      hr: ({node, ...props}) => <hr className="border-pink-200 my-4" {...props} />,
                    }}
                  >
                    {response}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Action Buttons */}
        {!loading && swiggyLink && (
          <div className="mt-8 flex gap-4">
            <a
              href={swiggyLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 px-6 py-4 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 rounded-xl font-semibold transition-all text-white text-center flex items-center justify-center gap-2 shadow-lg"
            >
              <i className="fas fa-external-link-alt"></i>
              <span>Open in Swiggy</span>
            </a>
            <button
              onClick={fetchCafeInfo}
              className="px-6 py-4 bg-dark-800 hover:bg-dark-700 border border-pink-500/30 rounded-xl font-semibold transition-all text-pink-300 flex items-center justify-center gap-2"
            >
              <i className="fas fa-sync-alt"></i>
              <span>Refresh</span>
            </button>
          </div>
        )}

        {/* Info Cards */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-dark-800 p-4 rounded-xl border border-gray-700">
            <div className="flex items-center gap-3">
              <i className="fas fa-map-marker-alt text-pink-500 text-xl"></i>
              <div>
                <p className="text-xs text-gray-500">Location</p>
                <p className="text-white text-sm">{cafe.address}</p>
              </div>
            </div>
          </div>

          {cafe.deliveryTime && cafe.deliveryTime !== 'N/A mins' && (
            <div className="bg-dark-800 p-4 rounded-xl border border-gray-700">
              <div className="flex items-center gap-3">
                <i className="fas fa-clock text-green-500 text-xl"></i>
                <div>
                  <p className="text-xs text-gray-500">Delivery</p>
                  <p className="text-white text-sm">{cafe.deliveryTime}</p>
                </div>
              </div>
            </div>
          )}

          {cafe.distance && cafe.distance !== 'N/A' && (
            <div className="bg-dark-800 p-4 rounded-xl border border-gray-700">
              <div className="flex items-center gap-3">
                <i className="fas fa-location-arrow text-blue-500 text-xl"></i>
                <div>
                  <p className="text-xs text-gray-500">Distance</p>
                  <p className="text-white text-sm">{cafe.distance}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
