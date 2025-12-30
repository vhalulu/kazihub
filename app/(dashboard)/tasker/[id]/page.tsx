'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import Image from 'next/image'
import VerifiedBadge from '@/components/VerifiedBadge'
import ReviewCard from '@/components/ReviewCard'
import StarRating from '@/components/StarRating'
import { TASK_CATEGORIES } from '@/lib/task-categories'
import { startConversation } from '@/lib/messaging'

export default function TaskerProfilePage() {
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()
  
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [tasker, setTasker] = useState<any>(null)
  const [reviews, setReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [reviewsLoading, setReviewsLoading] = useState(true)

  useEffect(() => {
    loadCurrentUser()
    loadTasker()
    loadReviews()
  }, [params.id])

  const loadCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      setCurrentUser(profileData)
    } catch (error) {
      console.error('Error loading current user:', error)
    }
  }

  const loadTasker = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', params.id)
        .single()

      if (error) throw error

      // Check if user is actually a tasker
      if (data.user_type !== 'tasker' && data.user_type !== 'both') {
        alert('This user is not a tasker')
        router.push('/browse-taskers')
        return
      }

      setTasker(data)
    } catch (error) {
      console.error('Error loading tasker:', error)
      alert('Tasker not found')
      router.push('/browse-taskers')
    } finally {
      setLoading(false)
    }
  }

  const loadReviews = async () => {
    try {
      setReviewsLoading(true)
      
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          reviewer:profiles!reviews_reviewer_id_fkey(
            full_name,
            profile_photo_url
          )
        `)
        .eq('reviewee_id', params.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      setReviews(data || [])
    } catch (error) {
      console.error('Error loading reviews:', error)
    } finally {
      setReviewsLoading(false)
    }
  }

  const handleContact = async () => {
    try {
      const conversationId = await startConversation(tasker.id)
      router.push(`/messages/${conversationId}`)
    } catch (error: any) {
      console.error('Error starting conversation:', error)
      alert(error.message || 'Failed to start conversation')
    }
  }

  const handleBookNow = () => {
    // TODO: Implement booking system
    alert('Booking feature coming soon! For now, you can contact the tasker directly.')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50/30 to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading tasker profile...</p>
        </div>
      </div>
    )
  }

  if (!tasker) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50/30 to-slate-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-lg"></div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              KaziHub
            </span>
          </Link>
          <Link 
            href="/browse-taskers"
            className="text-gray-600 hover:text-gray-900 font-medium"
          >
            ← Back to Browse Taskers
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-5xl mx-auto">
          
          {/* Profile Header */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-gray-100">
            <div className="flex flex-col md:flex-row gap-8">
              
              {/* Profile Photo */}
              <div className="flex-shrink-0">
                <div className="w-48 h-48 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 relative overflow-hidden">
                  {tasker.profile_photo_url ? (
                    <Image
                      src={tasker.profile_photo_url}
                      alt={tasker.full_name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-6xl font-bold text-white">
                        {tasker.full_name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Tasker Info */}
              <div className="flex-1">
                {/* Name and Badge */}
                <div className="flex items-center gap-3 mb-3">
                  <h1 className="text-4xl font-bold text-gray-900">{tasker.full_name}</h1>
                  <VerifiedBadge isVerified={tasker.is_verified} size="lg" />
                </div>

                {/* Location */}
                <p className="text-lg text-gray-600 mb-4">
                  📍 {tasker.town}, {tasker.county}
                </p>

                {/* Rating & Stats */}
                <div className="flex flex-wrap gap-6 mb-6">
                  <div>
                    <StarRating 
                      rating={Number(tasker.rating)} 
                      size="md"
                      showNumber={true}
                    />
                    <p className="text-sm text-gray-600 mt-1">
                      {tasker.total_reviews || 0} {tasker.total_reviews === 1 ? 'review' : 'reviews'}
                    </p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-600">{tasker.total_tasks_completed}</p>
                    <p className="text-sm text-gray-600">Tasks Completed</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-cyan-600">{tasker.years_experience} years</p>
                    <p className="text-sm text-gray-600">Experience</p>
                  </div>
                </div>

                {/* Bio */}
                {tasker.bio && (
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-600 mb-2">ABOUT</h3>
                    <p className="text-gray-700">{tasker.bio}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={handleBookNow}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-semibold hover:shadow-lg transition"
                  >
                    📅 Book Now
                  </button>
                  <button
                    onClick={handleContact}
                    className="flex-1 px-6 py-3 border-2 border-blue-600 text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition"
                  >
                    💬 Contact
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* Services Offered */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Services Offered</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {tasker.services_offered?.map((service: string) => {
                const category = TASK_CATEGORIES.find(c => c.value === service)
                return (
                  <div key={service} className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <span className="text-2xl mb-2 block">{category?.icon}</span>
                    <p className="font-semibold text-gray-900">{category?.label}</p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Rates */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Pricing</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-6 bg-blue-50 border-2 border-blue-200 rounded-xl">
                <p className="text-sm text-gray-600 mb-2">HOURLY RATE</p>
                <p className="text-4xl font-bold text-blue-600">KES {tasker.hourly_rate}</p>
                <p className="text-sm text-gray-600 mt-2">per hour</p>
              </div>
              {tasker.daily_rate && (
                <div className="p-6 bg-cyan-50 border-2 border-cyan-200 rounded-xl">
                  <p className="text-sm text-gray-600 mb-2">DAILY RATE</p>
                  <p className="text-4xl font-bold text-cyan-600">KES {tasker.daily_rate}</p>
                  <p className="text-sm text-gray-600 mt-2">per day</p>
                </div>
              )}
            </div>
          </div>

          {/* Portfolio Images */}
          {tasker.portfolio_images && tasker.portfolio_images.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Portfolio</h2>
              <div className="grid md:grid-cols-3 gap-4">
                {tasker.portfolio_images.map((imageUrl: string, index: number) => (
                  <div key={index} className="aspect-square rounded-xl overflow-hidden relative">
                    <Image
                      src={imageUrl}
                      alt={`Portfolio ${index + 1}`}
                      fill
                      className="object-cover hover:scale-105 transition"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reviews Section */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Reviews {tasker.total_reviews > 0 && `(${tasker.total_reviews})`}
            </h2>

            {reviewsLoading ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Loading reviews...</p>
              </div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">💬</div>
                <p className="text-gray-600">No reviews yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <ReviewCard key={review.id} review={review} />
                ))}
              </div>
            )}
          </div>

          {/* Availability */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Availability</h2>
            <div className="flex items-center gap-3">
              <div className={`w-4 h-4 rounded-full ${tasker.is_available ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-lg font-semibold text-gray-900">
                {tasker.is_available ? '✅ Available for work' : '❌ Currently unavailable'}
              </span>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
