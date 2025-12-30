'use client'

import StarRating from './StarRating'

interface ReviewCardProps {
  review: {
    id: string
    rating: number
    comment: string
    created_at: string
    reviewer: {
      full_name: string
      profile_photo_url?: string
    }
  }
}

export default function ReviewCard({ review }: ReviewCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = now.getTime() - date.getTime() // Fixed: removed Math.abs
    const diffMinutes = Math.floor(diffTime / (1000 * 60))
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60))
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    if (diffMinutes < 1) return 'Just now'
    if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? 's' : ''} ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition">
      {/* Reviewer Info */}
      <div className="flex items-start gap-4 mb-4">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {review.reviewer.profile_photo_url ? (
            <img
              src={review.reviewer.profile_photo_url}
              alt={review.reviewer.full_name}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
              {review.reviewer.full_name?.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Name, Rating, Date */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-bold text-gray-900">{review.reviewer.full_name}</h4>
            <span className="text-xs text-gray-500">{formatDate(review.created_at)}</span>
          </div>
          <StarRating rating={review.rating} size="sm" />
        </div>
      </div>

      {/* Review Comment */}
      <p className="text-gray-700 leading-relaxed">{review.comment}</p>
    </div>
  )
}
