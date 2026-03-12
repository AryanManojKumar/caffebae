export default function Assistant({ onOpenChat }) {
  return (
    <div className="fixed bottom-8 right-8 z-50 animate-fade-in">
      <button
        onClick={onOpenChat}
        className="group relative w-20 h-20 rounded-full shadow-2xl hover:scale-110 transition-transform duration-300 overflow-hidden border-4 border-pink-300"
      >
        <img 
          src="/bae.jpg" 
          alt="Bae" 
          className="w-full h-full object-cover"
        />
        
        <div className="absolute -top-1 -right-1 w-6 h-6 bg-pink-400 rounded-full border-4 border-white animate-pulse"></div>
        
        <div className="absolute bottom-full right-0 mb-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <div className="bg-white text-gray-800 px-4 py-2 rounded-lg text-sm whitespace-nowrap shadow-xl border-2 border-pink-200">
            Chat with Bae 💕
          </div>
        </div>
      </button>
    </div>
  )
}
