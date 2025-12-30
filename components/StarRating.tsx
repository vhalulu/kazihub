'use client'

interface StarRatingProps {
  rating: number
  onRatingChange?: (rating: number) => void
  size?: 'sm' | 'md' | 'lg' | 'xl'
  interactive?: boolean
  showNumber?: boolean
}

export default function StarRating({ 
  rating, 
  onRatingChange, 
  size = 'md',
  interactive = false,
  showNumber = false 
}: StarRatingProps) {
  
  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
    xl: 'text-4xl'
  }

  const handleClick = (starRating: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(starRating)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => handleClick(star)}
            disabled={!interactive}
            className={`${sizeClasses[size]} transition ${
              interactive 
                ? 'cursor-pointer hover:scale-110' 
                : 'cursor-default'
            }`}
          >
            <span className={star <= rating ? 'text-yellow-400' : 'text-gray-300'}>
              ⭐
            </span>
          </button>
        ))}
      </div>
      {showNumber && (
        <span className="text-sm font-semibold text-gray-700 ml-1">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  )
}