export default function Header() {
  return (
    <header className="border-b border-gray-800 bg-dark-800/50 backdrop-blur-xl sticky top-0 z-40">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <i className="fas fa-coffee text-white text-xl"></i>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gradient">CafeBae</h1>
              <p className="text-xs text-gray-500">AI-Powered Cafe Discovery</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 text-sm text-gray-400">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Live</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
