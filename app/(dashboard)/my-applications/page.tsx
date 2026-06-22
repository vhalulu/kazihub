'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import VerifiedBadge from '@/components/VerifiedBadge'
import LeaveReviewModal from '@/components/LeaveReviewModal'

export default function MyApplicationsPage() {
  const router = useRouter()
  const supabase = createClient()

  const [applications, setApplications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all')
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [selectedReviewTask, setSelectedReviewTask] = useState<any>(null)
  const [reviewedTasks, setReviewedTasks] = useState<Set<string>>(new Set())

  useEffect(() => {
    checkUserAccess()
  }, [])

  useEffect(() => {
    if (userProfile) {
      loadMyApplications()
      loadReviewedTasks()
    }
  }, [userProfile])

  // Auto-refresh when page becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && userProfile) {
        loadMyApplications()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [userProfile])

  const checkUserAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (!profile) {
        router.push('/dashboard')
        return
      }

      // Only taskers and "both" can view their applications
      if (profile.user_type !== 'tasker' && profile.user_type !== 'both') {
        router.push('/dashboard')
        return
      }

      setUserProfile(profile)
    } catch (error) {
      console.error('Auth check error:', error)
      router.push('/dashboard')
    }
  }

  const loadMyApplications = async () => {
    try {
      setLoading(true)

      const { data, error } = await supabase
        .from('task_applications')
        .select(`
          *,
          task:tasks(
            id,
            title,
            description,
            category,
            budget,
            status,
            town,
            county,
            is_urgent,
            created_at,
            client_id,
            client:profiles!tasks_client_id_fkey(
              full_name,
              phone_number,
              rating,
              is_verified
            )
          )
        `)
        .eq('tasker_id', userProfile.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      setApplications(data || [])
    } catch (error) {
      console.error('Error loading applications:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredApplications = applications.filter(app => {
    if (filter === 'all') return true
    return app.status === filter
  })

  const loadReviewedTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('task_id')
        .eq('reviewer_id', userProfile.id)

      if (error) throw error

      const taskIds = new Set(data?.map(r => r.task_id) || [])
      setReviewedTasks(taskIds)
    } catch (error) {
      console.error('Error loading reviewed tasks:', error)
    }
  }

  const handleReviewClick = (application: any) => {
    setSelectedReviewTask({
      id: application.task.id,
      title: application.task.title,
      clientId: application.task.client_id,
      clientName: application.task.client?.full_name
    })
    setShowReviewModal(true)
  }

  const handleReviewSuccess = () => {
    loadReviewedTasks()
    setShowReviewModal(false)
  }

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      cleaning: '🧹',
      plumbing: '🚰',
      electrical: '💡',
      painting: '🎨',
      moving: '🚚',
    }
    return icons[category] || '📋'
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* Professional Navigation */}
      <nav className="bg-[#2c3e50] border-b border-[#1a252f] sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/dashboard" className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">K</span>
              </div>
              <span className="text-xl font-bold text-white">KaziHub</span>
            </Link>
            <Link href="/dashboard" className="text-sm text-gray-300 hover:text-white transition">
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header with Refresh Button */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Applications</h1>
            <p className="text-gray-600">Track the status of your task applications</p>
          </div>
          <button
            onClick={loadMyApplications}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-2 mb-8">
          {[
            { value: 'all', label: 'All' },
            { value: 'pending', label: 'Pending' },
            { value: 'accepted', label: 'Accepted' },
            { value: 'rejected', label: 'Declined' },
          ].map(option => (
            <button
              key={option.value}
              onClick={() => setFilter(option.value as any)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === option.value
                  ? 'bg-[#2c3e50] text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Applications List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your applications...</p>
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center border border-gray-200">
            <svg className="w-24 h-24 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              {filter === 'all' ? 'No applications yet' : `No ${filter} applications`}
            </h3>
            <p className="text-gray-600 mb-6">
              {filter === 'all' 
                ? 'Start applying to tasks to earn money!' 
                : `You don't have any ${filter} applications at the moment.`
              }
            </p>
            {filter === 'all' && (
              <button
                onClick={() => router.push('/browse-tasks')}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                Browse Tasks
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {filteredApplications.map(application => (
              <div 
                key={application.id} 
                className={`bg-white rounded-lg shadow-sm border-2 overflow-hidden transition ${
                  application.status === 'accepted' ? 'border-green-300' :
                  application.status === 'rejected' ? 'border-red-300' :
                  'border-gray-200'
                }`}
              >
                <div className="p-6">
                  
                  {/* Status Badge */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{getCategoryIcon(application.task?.category)}</span>
                        <h3 className="text-xl font-bold text-gray-900">{application.task?.title}</h3>
                        {application.task?.is_urgent && (
                          <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">
                            URGENT
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 text-sm mb-2">{application.task?.description}</p>
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        </svg>
                        <span>{application.task?.town}, {application.task?.county}</span>
                      </div>
                    </div>

                    {/* Status */}
                    <div className={`px-4 py-2 rounded-full text-sm font-bold ${
                      application.status === 'accepted' ? 'bg-green-100 text-green-700' :
                      application.status === 'rejected' ? 'bg-red-100 text-red-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {application.status === 'accepted' ? '✅ Hired!' :
                       application.status === 'rejected' ? '❌ Declined' :
                       '⏳ Pending'}
                    </div>
                  </div>

                  {/* Application Details */}
                  <div className="grid md:grid-cols-3 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-xs font-semibold text-gray-700 mb-1">Your Proposed Price</p>
                      <p className="text-lg font-bold text-green-600">Ksh {application.proposed_price.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-700 mb-1">Client's Budget</p>
                      <p className="text-lg font-bold text-gray-700">Ksh {application.task?.budget.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-700 mb-1">Applied On</p>
                      <p className="text-sm font-semibold text-gray-700">
                        {new Date(application.created_at).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Your Message */}
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-gray-700 mb-1">YOUR MESSAGE:</p>
                    <p className="text-sm text-gray-700 bg-blue-50 p-3 rounded-lg border border-blue-200">
                      "{application.message}"
                    </p>
                  </div>

                  {/* Accepted - Show Client Contact */}
                  {application.status === 'accepted' && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg mb-4">
                      <h4 className="font-bold text-green-900 mb-2">🎉 Congratulations! You have been hired!</h4>
                      <p className="text-sm text-green-800 mb-3">Contact the client to coordinate the task:</p>
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-bold">
                          {application.task?.client?.full_name?.charAt(0).toUpperCase() || 'C'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-gray-900">{application.task?.client?.full_name}</p>
                            <VerifiedBadge isVerified={application.task?.client?.is_verified} size="sm" />
                          </div>
                          <p className="text-sm text-gray-700">📱 {application.task?.client?.phone_number}</p>
                          <div className="flex items-center gap-1 mt-1">
                            <span className="text-yellow-500 text-xs">⭐</span>
                            <span className="text-xs text-gray-600">
                              {application.task?.client?.rating?.toFixed(1) || 'New'} rating
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Leave Review Button - Only show if task is completed */}
                      {application.task?.status === 'completed' && (
                        reviewedTasks.has(application.task.id) ? (
                          <div className="flex items-center gap-2 p-3 bg-white border border-green-300 rounded-lg">
                            <span className="text-green-600">✅</span>
                            <span className="text-sm font-semibold text-green-800">You reviewed this client</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleReviewClick(application)}
                            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
                          >
                            ⭐ Leave a Review for {application.task?.client?.full_name?.split(' ')[0]}
                          </button>
                        )
                      )}
                    </div>
                  )}

                  {/* Rejected - Show Message */}
                  {application.status === 'rejected' && application.rejection_message && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <h4 className="font-bold text-red-900 mb-2">Message from Client:</h4>
                      <p className="text-sm text-red-800 italic">
                        "{application.rejection_message}"
                      </p>
                      <p className="text-xs text-red-700 mt-3">
                        💡 Keep applying! Your next opportunity is just around the corner.
                      </p>
                    </div>
                  )}

                  {/* Pending - Waiting */}
                  {application.status === 'pending' && (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-sm text-amber-800">
                        ⏳ Your application is being reviewed by the client. You will be notified once they make a decision.
                      </p>
                    </div>
                  )}

                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* Leave Review Modal */}
      {showReviewModal && selectedReviewTask && (
        <LeaveReviewModal
          task={selectedReviewTask}
          revieweeId={selectedReviewTask.clientId}
          revieweeName={selectedReviewTask.clientName}
          onClose={() => setShowReviewModal(false)}
          onSuccess={handleReviewSuccess}
        />
      )}
    </div>
  )
}
