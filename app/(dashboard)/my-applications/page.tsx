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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50/30 to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

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
          <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 font-medium">
            ← Back to Dashboard
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-5xl mx-auto">
          
          {/* Header with Refresh Button */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">My Applications</h1>
              <p className="text-gray-600">Track the status of your task applications</p>
            </div>
            <button
              onClick={loadMyApplications}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '🔄 Refreshing...' : '🔄 Refresh'}
            </button>
          </div>

          {/* Filter Buttons */}
          <div className="flex gap-2 mb-8">
            {[
              { value: 'all', label: 'All', icon: '📋' },
              { value: 'pending', label: 'Pending', icon: '⏳' },
              { value: 'accepted', label: 'Accepted', icon: '✅' },
              { value: 'rejected', label: 'Declined', icon: '❌' },
            ].map(option => (
              <button
                key={option.value}
                onClick={() => setFilter(option.value as any)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filter === option.value
                    ? 'bg-cyan-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {option.icon} {option.label}
              </button>
            ))}
          </div>

          {/* Applications List */}
          {loading ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 border-4 border-cyan-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your applications...</p>
            </div>
          ) : filteredApplications.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-gray-100">
              <div className="text-6xl mb-4">🔍</div>
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
                  className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-cyan-500/30 transition"
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
                  className={`bg-white rounded-2xl shadow-lg border-2 overflow-hidden transition ${
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
                            <span className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
                              🚀 URGENT
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600 text-sm mb-2">{application.task?.description}</p>
                        <p className="text-sm text-gray-500">
                          📍 {application.task?.town}, {application.task?.county}
                        </p>
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
                    <div className="grid md:grid-cols-3 gap-4 mb-4 p-4 bg-gray-50 rounded-xl">
                      <div>
                        <p className="text-xs text-gray-500">Your Proposed Price</p>
                        <p className="text-lg font-bold text-blue-600">Ksh {application.proposed_price.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Client's Budget</p>
                        <p className="text-lg font-bold text-gray-700">Ksh {application.task?.budget.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Applied On</p>
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
                      <p className="text-xs font-semibold text-gray-500 mb-1">YOUR MESSAGE:</p>
                      <p className="text-sm text-gray-700 bg-blue-50 p-3 rounded-lg border border-blue-200">
                        "{application.message}"
                      </p>
                    </div>

                    {/* Accepted - Show Client Contact */}
                    {application.status === 'accepted' && (
                      <div className="p-4 bg-green-50 border border-green-200 rounded-xl mb-4">
                        <h4 className="font-bold text-green-900 mb-2">🎉 Congratulations! You have been hired!</h4>
                        <p className="text-sm text-green-800 mb-3">Contact the client to coordinate the task:</p>
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-full flex items-center justify-center text-white font-bold">
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
                              className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg font-semibold hover:shadow-lg transition"
                            >
                              ⭐ Leave a Review for {application.task?.client?.full_name?.split(' ')[0]}
                            </button>
                          )
                        )}
                      </div>
                    )}

                    {/* Rejected - Show Message */}
                    {application.status === 'rejected' && application.rejection_message && (
                      <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
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
                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
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
