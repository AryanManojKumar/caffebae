import { useEffect, useRef } from 'react'
import CafeCard from './CafeCard'

export default function CafeGrid({ cafes, approvedCafes, onCafeClick, loading, hasMore, onLoadMore }) {
  const observerRef = useRef()
  const loadMoreRef = useRef()

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          onLoadMore()
        }
      },
      { threshold: 0.1 }
    )

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current)
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [hasMore, loading, onLoadMore])

  if (cafes.length === 0 && !loading) {
    return null
  }

  return (
    <div className="mt-12">
      {cafes.length > 0 && (
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-xl font-semibold text-gray-300">
            Found {cafes.length} cafes
          </h3>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cafes.map((cafe, index) => (
          <CafeCard
            key={`${cafe.id}-${index}`}
            cafe={cafe}
            isApproved={approvedCafes.has(cafe.id)}
            onClick={() => onCafeClick(cafe)}
          />
        ))}
      </div>

      {loading && (
        <div className="text-center py-12">
          <i className="fas fa-spinner fa-spin text-4xl text-purple-500"></i>
          <p className="mt-4 text-gray-400">Loading cafes...</p>
        </div>
      )}

      {hasMore && !loading && cafes.length > 0 && (
        <div ref={loadMoreRef} className="h-20"></div>
      )}

      {!hasMore && cafes.length > 0 && (
        <div className="text-center py-12 text-gray-500">
          <i className="fas fa-check-circle text-2xl mb-2"></i>
          <p>All cafes loaded</p>
        </div>
      )}
    </div>
  )
}
