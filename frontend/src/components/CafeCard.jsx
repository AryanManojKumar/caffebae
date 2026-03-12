export default function CafeCard({ cafe, isApproved, onClick }) {
  const {
    name = 'Unknown Restaurant',
    cuisine = 'Various',
    rating = 'N/A',
    address = 'Address not available',
    priceRange = 'N/A',
    image = 'https://via.placeholder.com/400x300?text=No+Image',
    distance = '',
    deliveryTime = '',
    isOpen = true
  } = cafe

  const ratingColor = rating >= 4.0
    ? 'from-green-500 to-emerald-500'
    : rating >= 3.5
      ? 'from-yellow-500 to-orange-500'
      : 'from-orange-500 to-red-500'

  return (
    <div
      onClick={onClick}
      className={`group cursor-pointer bg-dark-800 rounded-xl overflow-hidden border transition-all duration-300 ${isApproved
        ? 'border-pink-500 shadow-lg shadow-pink-500/50 scale-[1.02]'
        : 'border-gray-800 hover:border-gray-700'
        } ${!isOpen ? 'opacity-60' : ''} card-hover`}
    >
      <div className="relative h-48 overflow-hidden">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          onError={(e) => e.target.src = 'https://via.placeholder.com/400x300?text=No+Image'}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>

        {isApproved && (
          <div className="absolute top-3 left-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 animate-pulse shadow-lg">
            <i className="fas fa-heart"></i>
            <span>Bae's Pick 💕</span>
          </div>
        )}

        {!isOpen && (
          <div className="absolute top-3 right-3 bg-red-500 text-white px-3 py-1 rounded-lg text-xs font-bold">
            Closed
          </div>
        )}

        {rating !== 'N/A' && (
          <div className={`absolute bottom-3 left-3 bg-gradient-to-r ${ratingColor} text-white px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1.5 shadow-lg`}>
            <i className="fas fa-star text-xs"></i>
            <span>{rating}</span>
          </div>
        )}
      </div>

      <div className="p-5 space-y-3">
        <h3 className="text-lg font-bold text-white line-clamp-1 group-hover:text-pink-400 transition-colors">
          {name}
        </h3>

        <div className="flex items-center gap-2 text-sm text-gray-400">
          <i className="fas fa-utensils text-pink-500"></i>
          <span className="line-clamp-1">{cuisine}</span>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-500">
          <i className="fas fa-map-marker-alt text-pink-500"></i>
          <span className="line-clamp-1">{address}</span>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-700">
          <div className="flex items-center gap-3 text-xs">
            {distance && distance !== 'N/A' && (
              <span className="flex items-center gap-1 text-gray-400">
                <i className="fas fa-location-arrow text-blue-400"></i>
                {distance}
              </span>
            )}
            {deliveryTime && deliveryTime !== 'N/A mins' && (
              <span className="flex items-center gap-1 text-gray-400">
                <i className="fas fa-clock text-green-400"></i>
                {deliveryTime}
              </span>
            )}
          </div>
          <div className="text-pink-400 font-bold text-sm">
            {priceRange}
          </div>
        </div>
      </div>
    </div>
  )
}
