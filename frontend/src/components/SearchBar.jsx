export default function SearchBar({ location, setLocation, onSearch, loading }) {
  const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Pune']

  return (
    <div className="space-y-6">
      <div className="text-center space-y-3">
        <h2 className="text-4xl md:text-5xl font-bold text-white">
          Discover Your Perfect Cafe
        </h2>
        <p className="text-gray-400 text-lg">
          AI-powered recommendations tailored to your taste
        </p>
      </div>

      <div className="max-w-2xl mx-auto">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <i className="fas fa-map-marker-alt absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"></i>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && onSearch()}
              placeholder="Enter city name..."
              className="w-full pl-12 pr-4 py-4 bg-dark-700 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>
          <button
            onClick={onSearch}
            disabled={loading}
            className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-semibold transition-all"
          >
            {loading ? (
              <i className="fas fa-spinner fa-spin"></i>
            ) : (
              <i className="fas fa-search"></i>
            )}
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mt-4 justify-center">
          {cities.map(city => (
            <button
              key={city}
              onClick={() => {
                setLocation(city)
                setTimeout(onSearch, 100)
              }}
              className="px-4 py-2 bg-dark-700 hover:bg-dark-600 border border-gray-700 hover:border-gray-600 rounded-lg text-sm text-gray-300 transition-colors"
            >
              {city}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
