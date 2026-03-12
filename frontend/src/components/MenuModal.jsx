export default function MenuModal({ cafe, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-dark-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col border border-gray-700 overflow-hidden">
        {/* Header with Image */}
        <div className="relative h-64">
          <img
            src={cafe.image}
            alt={cafe.name}
            className="w-full h-full object-cover"
            onError={(e) => e.target.src = 'https://via.placeholder.com/800x300?text=No+Image'}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-dark-800 via-dark-800/50 to-transparent"></div>
          
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-dark-900/80 hover:bg-dark-900 text-white transition-colors backdrop-blur-sm"
          >
            <i className="fas fa-times"></i>
          </button>

          <div className="absolute bottom-6 left-6 right-6">
            <h2 className="text-3xl font-bold text-white mb-2">{cafe.name}</h2>
            <div className="flex items-center gap-4 flex-wrap">
              {cafe.rating !== 'N/A' && (
                <div className="flex items-center gap-2 bg-green-500 text-white px-3 py-1.5 rounded-lg font-bold">
                  <i className="fas fa-star"></i>
                  <span>{cafe.rating}</span>
                </div>
              )}
              <span className="text-gray-300">{cafe.cuisine}</span>
              <span className="text-purple-400 font-bold">{cafe.priceRange}</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Info Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <i className="fas fa-map-marker-alt text-pink-500 mt-1"></i>
                <div>
                  <p className="text-sm text-gray-400">Address</p>
                  <p className="text-white">{cafe.address}</p>
                </div>
              </div>

              {cafe.distance && cafe.distance !== 'N/A' && (
                <div className="flex items-start gap-3">
                  <i className="fas fa-location-arrow text-blue-500 mt-1"></i>
                  <div>
                    <p className="text-sm text-gray-400">Distance</p>
                    <p className="text-white">{cafe.distance}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3">
              {cafe.deliveryTime && cafe.deliveryTime !== 'N/A mins' && (
                <div className="flex items-start gap-3">
                  <i className="fas fa-clock text-green-500 mt-1"></i>
                  <div>
                    <p className="text-sm text-gray-400">Delivery Time</p>
                    <p className="text-white">{cafe.deliveryTime}</p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <i className={`fas fa-circle ${cafe.isOpen ? 'text-green-500' : 'text-red-500'} mt-1`}></i>
                <div>
                  <p className="text-sm text-gray-400">Status</p>
                  <p className={cafe.isOpen ? 'text-green-400' : 'text-red-400'}>
                    {cafe.isOpen ? 'Open Now' : 'Closed'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Menu Section Placeholder */}
          <div className="border-t border-gray-700 pt-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <i className="fas fa-utensils text-purple-500"></i>
              Menu
            </h3>
            <div className="bg-dark-700 rounded-xl p-8 text-center border border-gray-600">
              <i className="fas fa-coffee text-gray-600 text-5xl mb-4"></i>
              <p className="text-gray-400">Menu details coming soon!</p>
              <p className="text-sm text-gray-500 mt-2">Full menu integration in progress</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-700 bg-dark-900/50">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-dark-700 hover:bg-dark-600 border border-gray-600 rounded-xl font-semibold transition-colors text-white"
            >
              Close
            </button>
            <button
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl font-semibold transition-all text-white"
            >
              <i className="fas fa-external-link-alt mr-2"></i>
              View on Swiggy
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
