import { useState, useEffect } from 'react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

export default function CafeDetailPage({ cafe, onClose }) {
  const [loading, setLoading] = useState(true)
  const [restaurantData, setRestaurantData] = useState(null)
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [menuAvailable, setMenuAvailable] = useState(true)

  useEffect(() => {
    fetchRestaurantDetails()
  }, [cafe.id])

  const fetchRestaurantDetails = async () => {
    try {
      setLoading(true)
      const response = await axios.post(`${API_URL}/restaurant/${cafe.id}`, {
        lat: cafe.lat || 19.0760,
        lng: cafe.lng || 72.8777
      })

      if (response.data.success) {
        setRestaurantData(response.data)
        setMenuAvailable(response.data.menuAvailable !== false)
        if (response.data.categories?.length > 0) {
          setSelectedCategory(response.data.categories[0])
        }
      }
    } catch (error) {
      console.error('Error fetching restaurant details:', error)
      setMenuAvailable(false)
    } finally {
      setLoading(false)
    }
  }

  const filteredMenu = selectedCategory === 'All' 
    ? restaurantData?.menu || []
    : restaurantData?.menu?.filter(item => item.category === selectedCategory) || []

  return (
    <div className="fixed inset-0 z-50 bg-dark-900 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-dark-800/95 backdrop-blur-xl border-b border-gray-800">
        <div className="container mx-auto px-4 py-4 max-w-7xl">
          <div className="flex items-center justify-between">
            <button
              onClick={onClose}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <i className="fas fa-arrow-left"></i>
              <span>Back</span>
            </button>
            <div className="flex items-center gap-4">
              <button className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-dark-700 text-gray-400 hover:text-white transition-colors">
                <i className="fas fa-share-alt"></i>
              </button>
              <button className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-dark-700 text-gray-400 hover:text-white transition-colors">
                <i className="fas fa-heart"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <i className="fas fa-spinner fa-spin text-5xl text-purple-500 mb-4"></i>
            <p className="text-gray-400">Loading menu...</p>
          </div>
        </div>
      ) : (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Hero Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            <div className="relative h-96 rounded-2xl overflow-hidden">
              <img
                src={cafe.image}
                alt={cafe.name}
                className="w-full h-full object-cover"
                onError={(e) => e.target.src = 'https://via.placeholder.com/800x600?text=No+Image'}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
            </div>

            <div className="space-y-6">
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">{restaurantData?.restaurant?.name || cafe.name}</h1>
                <p className="text-gray-400 text-lg">{restaurantData?.restaurant?.cuisines?.join(', ') || cafe.cuisine}</p>
              </div>

              <div className="flex items-center gap-6 flex-wrap">
                {(restaurantData?.restaurant?.avgRating || cafe.rating) !== 'N/A' && (
                  <div className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg font-bold">
                    <i className="fas fa-star"></i>
                    <span>{restaurantData?.restaurant?.avgRating || cafe.rating}</span>
                    {restaurantData?.restaurant?.totalRatings && (
                      <span className="text-sm opacity-80">({restaurantData.restaurant.totalRatings})</span>
                    )}
                  </div>
                )}
                <div className="text-purple-400 font-bold text-lg">
                  {restaurantData?.restaurant?.costForTwo || cafe.priceRange}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-dark-800 p-4 rounded-xl border border-gray-700">
                  <div className="flex items-center gap-3">
                    <i className="fas fa-clock text-green-500 text-xl"></i>
                    <div>
                      <p className="text-xs text-gray-500">Delivery Time</p>
                      <p className="text-white font-semibold">{restaurantData?.restaurant?.deliveryTime || cafe.deliveryTime?.replace(' mins', '')} mins</p>
                    </div>
                  </div>
                </div>

                <div className="bg-dark-800 p-4 rounded-xl border border-gray-700">
                  <div className="flex items-center gap-3">
                    <i className="fas fa-location-arrow text-blue-500 text-xl"></i>
                    <div>
                      <p className="text-xs text-gray-500">Distance</p>
                      <p className="text-white font-semibold">{cafe.distance}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-dark-800 p-4 rounded-xl border border-gray-700">
                <div className="flex items-start gap-3">
                  <i className="fas fa-map-marker-alt text-pink-500 mt-1"></i>
                  <div>
                    <p className="text-xs text-gray-500">Address</p>
                    <p className="text-white">{restaurantData?.restaurant?.address || cafe.address}</p>
                    {restaurantData?.restaurant?.city && (
                      <p className="text-gray-400 text-sm mt-1">{restaurantData.restaurant.city}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Menu Section */}
          <div>
            <h2 className="text-3xl font-bold text-white mb-6">Menu</h2>

            {restaurantData?.categories && restaurantData.categories.length > 0 && (
              <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                <button
                  onClick={() => setSelectedCategory('All')}
                  className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                    selectedCategory === 'All'
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                      : 'bg-dark-800 text-gray-400 hover:text-white border border-gray-700'
                  }`}
                >
                  All Items
                </button>
                {restaurantData.categories.map(category => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                      selectedCategory === category
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                        : 'bg-dark-800 text-gray-400 hover:text-white border border-gray-700'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            )}

            {filteredMenu.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredMenu.map((item, index) => (
                  <div
                    key={`${item.id}-${index}`}
                    className="bg-dark-800 rounded-xl overflow-hidden border border-gray-700 hover:border-gray-600 transition-colors"
                  >
                    <div className="flex gap-4 p-4">
                      <div className="flex-1">
                        <div className="flex items-start gap-2 mb-2">
                          {item.isVeg !== undefined && (
                            <div className={`w-5 h-5 border-2 ${item.isVeg ? 'border-green-500' : 'border-red-500'} rounded flex items-center justify-center flex-shrink-0 mt-1`}>
                              <div className={`w-2 h-2 rounded-full ${item.isVeg ? 'bg-green-500' : 'bg-red-500'}`}></div>
                            </div>
                          )}
                          <h3 className="font-semibold text-white">{item.name}</h3>
                        </div>

                        {item.description && (
                          <p className="text-sm text-gray-400 mb-3 line-clamp-2">{item.description}</p>
                        )}

                        <div className="flex items-center justify-between">
                          <span className="text-white font-bold">₹{item.price}</span>
                          {item.rating && (
                            <div className="flex items-center gap-1 text-sm text-green-400">
                              <i className="fas fa-star text-xs"></i>
                              <span>{item.rating}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {item.image && item.image.includes('swiggy') && (
                        <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover"
                            onError={(e) => e.target.style.display = 'none'}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-dark-800 rounded-xl p-12 text-center border border-gray-700">
                <i className="fas fa-utensils text-gray-600 text-5xl mb-4"></i>
                <p className="text-gray-400 text-lg">
                  {menuAvailable ? 'No items in this category' : 'Menu temporarily unavailable'}
                </p>
                <p className="text-gray-500 text-sm mt-2">
                  {menuAvailable 
                    ? 'Try selecting a different category' 
                    : 'The restaurant menu is currently being updated. Please check back later or visit the restaurant directly.'}
                </p>
                {!menuAvailable && (
                  <button
                    onClick={fetchRestaurantDetails}
                    className="mt-6 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl font-semibold transition-all text-white"
                  >
                    <i className="fas fa-sync-alt mr-2"></i>
                    Try Again
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
