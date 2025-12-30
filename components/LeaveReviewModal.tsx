'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import StarRating from './StarRating'

interface LeaveReviewModalProps {
  task: any
  revieweeId: string // Person being reviewed
  revieweeName: string
  onClose: () => void
  onSuccess: () => void
}

export default function LeaveReviewModal({
  task,
  revieweeId,
  revieweeName,
  onClose,
  onSuccess
}: LeaveReviewModalProps) {
  const supabase = createClient()
  
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (rating === 0) {
      setError('Please select a rating')
      return
    }

    if (!comment.trim()) {
      setError('Please write a review comment')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('Not authenticated')
      }

      const { error: insertError } = await supabase
        .from('reviews')
        .insert({
          task_id: task.id,
          reviewer_id: user.id,
          reviewee_id: revieweeId,
          rating: rating,
          comment: comment.trim()
        })

      if (insertError) throw insertError

      alert('✅ Review submitted successfully!')
      onSuccess()
      onClose()
    } catch (error: any) {
      console.error('Error submitting review:', error)
      if (error.message.includes('duplicate')) {
        setError('You have already reviewed this task')
      } else {
        setError(error.message || 'Failed to submit review')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          Leave a Review
        </h3>
        <p className="text-gray-600 mb-6">
          How was your experience with <span className="font-semibold">{revieweeName}</span>?
        </p>

        <form onSubmit={handleSubmit}>
          {/* Task Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-xl">
            <p className="text-sm text-gray-600 mb-1">Task:</p>
            <p className="font-semibold text-gray-900">{task.title}</p>
          </div>

          {/* Rating */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Rating *
            </label>
            <div className="flex justify-center">
              <StarRating 
                rating={rating} 
                onRatingChange={setRating}
                size="xl"
                interactive={true}
              />
            </div>
            {rating > 0 && (
              <p className="text-center mt-2 text-sm font-semibold text-blue-600">
                {rating === 5 && '🌟 Excellent!'}
                {rating === 4 && '😊 Great!'}
                {rating === 3 && '👍 Good'}
                {rating === 2 && '😕 Fair'}
                {rating === 1 && '😞 Poor'}
              </p>
            )}
          </div>

          {/* Comment */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Your Review *
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience with this person..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1">
              {comment.length}/500 characters
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || rating === 0}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-semibold hover:shadow-lg transition disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}