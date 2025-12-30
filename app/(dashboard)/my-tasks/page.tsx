'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import VerifiedBadge from '@/components/VerifiedBadge'
import LeaveReviewModal from '@/components/LeaveReviewModal'

export default function MyTasksPage() {
  const router = useRouter()
  const supabase = createClient()

  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [selectedTask, setSelectedTask] = useState<any>(null)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [selectedReviewTasker, setSelectedReviewTasker] = useState<any>(null)
  const [reviewedTasks, setReviewedTasks] = useState<Set<string>>(new Set())

  useEffect(() => {
    checkUserAccess()
  }, [])

  useEffect(() => {
    if (userProfile) {
      loadMyTasks()
      loadReviewedTasks()
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

      // Only clients and "both" can view their tasks
      if (profile.user_type !== 'client' && profile.user_type !== 'both') {
        router.push('/dashboard')
        return
      }

      setUserProfile(profile)
    } catch (error) {
      console.error('Auth check error:', error)
      router.push('/dashboard')
    }
  }

  const loadMyTasks = async () => {
    try {
      setLoading(true)

      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          applications:task_applications(
            id,
            tasker_id,
            proposed_price,
            message,
            status,
            created_at,
            rejection_message,
            tasker:profiles!task_applications_tasker_id_fkey(
              full_name,
              phone_number,
              rating,
              years_experience,
              county,
              town,
              is_verified
            )
          )
        `)
        .eq('client_id', userProfile.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      console.log('Tasks reloaded:', data)
      setTasks(data || [])
    } catch (error) {
      console.error('Error loading tasks:', error)
    } finally {
      setLoading(false)
    }
  }

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

  const handleReviewTasker = (task: any, application: any) => {
    setSelectedReviewTasker({
      id: task.id,
      title: task.title,
      taskerId: application.tasker_id,
      taskerName: application.tasker?.full_name
    })
    setShowReviewModal(true)
  }

  const handleReviewSuccess = () => {
    loadReviewedTasks()
    loadMyTasks()
    setShowReviewModal(false)
  }

  const handleCompleteTask = async (task: any) => {
    if (!confirm('Mark this task as completed? This will allow both you and the tasker to leave reviews.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('tasks')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', task.id)

      if (error) throw error

      alert('✅ Task marked as completed! You can now leave a review for the tasker.')
      loadMyTasks()
    } catch (error: any) {
      console.error('Error completing task:', error)
      alert(error.message || 'Failed to complete task')
    }
  }

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      cleaning: '🧹',
      plumbing: '🚰',
      electrical: '💡',
    }
    return icons[category] || '📋'
  }

  // Helper function to check if task is FULL
  const isTaskFull = (task: any) => {
    if (!task.max_applicants) return false
    const applicationsCount = task.applications?.length || 0
    return applicationsCount >= task.max_applicants
  }

  // Helper function to get task display status
  const getTaskDisplayStatus = (task: any) => {
    // If task is cancelled or completed, show that
    if (task.status === 'cancelled') return { label: '❌ Cancelled', color: 'bg-red-100 text-red-700' }
    if (task.status === 'completed') return { label: '✅ Completed', color: 'bg-gray-100 text-gray-700' }
    if (task.status === 'in_progress') return { label: '🔵 In Progress', color: 'bg-blue-100 text-blue-700' }
    
    // If task is open but FULL
    if (task.status === 'open' && isTaskFull(task)) {
      return { label: '🔒 FULL', color: 'bg-amber-100 text-amber-700' }
    }
    
    // If task is open and accepting applications
    return { label: '🟢 Open', color: 'bg-green-100 text-green-700' }
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
        <div className="max-w-6xl mx-auto">
          
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">My Tasks</h1>
            <p className="text-gray-600">Manage your posted tasks and review applications</p>
          </div>

          {/* Tasks List */}
          {loading ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your tasks...</p>
            </div>
          ) : tasks.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-gray-100">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No tasks yet</h3>
              <p className="text-gray-600 mb-6">Post your first task to get started!</p>
              <button
                onClick={() => router.push('/post-task')}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/30 transition"
              >
                Post a Task
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {tasks.map(task => {
                const displayStatus = getTaskDisplayStatus(task)
                const isFull = isTaskFull(task)
                
                return (
                  <div key={task.id} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                    
                    {/* Task Header */}
                    <div className="p-6 border-b border-gray-200">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-2xl">{getCategoryIcon(task.category)}</span>
                            <h3 className="text-2xl font-bold text-gray-900">{task.title}</h3>
                            {task.is_urgent && (
                              <span className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
                                🚀 URGENT
                              </span>
                            )}
                            {isFull && task.status === 'open' && (
                              <span className="px-2 py-1 bg-amber-500 text-white text-xs font-bold rounded-full">
                                🔒 FULL
                              </span>
                            )}
                          </div>
                          <p className="text-gray-600">{task.description}</p>
                        </div>
                        <div className="ml-4 flex flex-col gap-2">
                          <div className={`px-3 py-1 rounded-full text-sm font-semibold ${displayStatus.color}`}>
                            {displayStatus.label}
                          </div>
                          {task.status === 'open' && (
                            <button
                              onClick={() => router.push(`/edit-task/${task.id}`)}
                              className="px-3 py-1 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition"
                            >
                              ✏️ Edit
                            </button>
                          )}
                          {task.status === 'in_progress' && (
                            <button
                              onClick={() => handleCompleteTask(task)}
                              className="px-3 py-1 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition"
                            >
                              ✅ Mark Complete
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 mt-4">
                        <div>
                          <p className="text-sm text-gray-500">Budget</p>
                          <p className="text-lg font-bold text-blue-600">Ksh {task.budget.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Location</p>
                          <p className="text-sm font-semibold text-gray-900">📍 {task.town}, {task.county}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Applications</p>
                          <p className="text-lg font-bold text-cyan-600">
                            {task.applications?.length || 0}
                            {task.max_applicants && ` / ${task.max_applicants}`}
                          </p>
                          {isFull && (
                            <p className="text-xs text-amber-600 font-semibold">Maximum reached</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Applications */}
                    {task.applications && task.applications.length > 0 ? (
                      <div className="p-6">
                        <h4 className="text-lg font-bold text-gray-900 mb-4">
                          Applications ({task.applications.length})
                          {task.max_applicants && ` - Max: ${task.max_applicants}`}
                        </h4>
                        <div className="space-y-4">
                          {task.applications.map((application: any) => (
                            <ApplicationCard
                              key={application.id}
                              application={application}
                              task={task}
                              taskStatus={task.status}
                              onUpdate={loadMyTasks}
                              onReview={handleReviewTasker}
                              hasReviewed={reviewedTasks.has(task.id)}
                            />
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="p-6 text-center">
                        <p className="text-gray-500">
                          {isFull 
                            ? 'This task is now full and not accepting new applications.'
                            : 'No applications yet. Share your task to get more visibility!'
                          }
                        </p>
                      </div>
                    )}

                  </div>
                )
              })}
            </div>
          )}

        </div>
      </div>

      {/* Leave Review Modal */}
      {showReviewModal && selectedReviewTasker && (
        <LeaveReviewModal
          task={selectedReviewTasker}
          revieweeId={selectedReviewTasker.taskerId}
          revieweeName={selectedReviewTasker.taskerName}
          onClose={() => setShowReviewModal(false)}
          onSuccess={handleReviewSuccess}
        />
      )}
    </div>
  )
}

// Application Card Component
function ApplicationCard({ application, task, taskStatus, onUpdate, onReview, hasReviewed }: any) {
  const supabase = createClient()
  const [accepting, setAccepting] = useState(false)
  const [rejecting, setRejecting] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)

  const handleAccept = async () => {
    if (!confirm('Are you sure you want to hire this tasker? All other applications will be automatically rejected.')) {
      return
    }

    setAccepting(true)

    try {
      // Call API to accept application
      const response = await fetch('/api/applications/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId: application.id })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to accept application')
      }

      alert('✅ Application accepted! The tasker has been hired.')
      await onUpdate()
    } catch (error: any) {
      alert(error.message)
    } finally {
      setAccepting(false)
    }
  }

  const handleReject = async (reason?: string) => {
    setRejecting(true)

    try {
      // Call API to reject application
      const response = await fetch('/api/applications/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          applicationId: application.id,
          rejectionMessage: reason || 'Thank you for your application. We have decided to move forward with another candidate.'
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reject application')
      }

      alert('Application declined. A polite message has been sent to the tasker.')
      setShowRejectModal(false)
      await onUpdate()
    } catch (error: any) {
      alert(error.message)
    } finally {
      setRejecting(false)
    }
  }

  return (
    <>
      <div className={`p-4 rounded-xl border-2 ${
        application.status === 'accepted' ? 'border-green-300 bg-green-50' :
        application.status === 'rejected' ? 'border-red-300 bg-red-50' :
        'border-gray-200 bg-gray-50'
      }`}>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4 flex-1">
            {/* Avatar */}
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
              {application.tasker?.full_name?.charAt(0).toUpperCase() || 'T'}
            </div>

            {/* Tasker Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h5 className="font-bold text-gray-900">{application.tasker?.full_name}</h5>
                <VerifiedBadge isVerified={application.tasker?.is_verified} size="sm" />
                <div className="flex items-center gap-1">
                  <span className="text-yellow-500 text-sm">⭐</span>
                  <span className="text-sm text-gray-600">{application.tasker?.rating?.toFixed(1) || 'New'}</span>
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-2">
                📍 {application.tasker?.town}, {application.tasker?.county}
                {application.tasker?.years_experience > 0 && (
                  <span className="ml-3">💼 {application.tasker.years_experience} years exp.</span>
                )}
              </p>

              <p className="text-sm text-gray-700 mb-3 bg-white p-3 rounded-lg border border-gray-200">
                "{application.message}"
              </p>

              <div className="flex items-center gap-4">
                <div>
                  <p className="text-xs text-gray-500">Proposed Price</p>
                  <p className="text-xl font-bold text-blue-600">Ksh {application.proposed_price.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Status</p>
                  <p className={`text-sm font-semibold ${
                    application.status === 'accepted' ? 'text-green-600' :
                    application.status === 'rejected' ? 'text-red-600' :
                    'text-amber-600'
                  }`}>
                    {application.status === 'accepted' ? '✅ Hired' :
                     application.status === 'rejected' ? '❌ Declined' :
                     '⏳ Pending'}
                  </p>
                </div>
              </div>

              {/* Show rejection message if declined */}
              {application.status === 'rejected' && application.rejection_message && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-xs font-semibold text-red-900 mb-1">Your message to this tasker:</p>
                  <p className="text-sm text-red-800 italic">"{application.rejection_message}"</p>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          {application.status === 'pending' && taskStatus === 'open' && (
            <div className="flex gap-2 ml-4">
              <button
                onClick={handleAccept}
                disabled={accepting}
                className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50"
              >
                {accepting ? 'Hiring...' : 'Hire'}
              </button>
              <button
                onClick={() => setShowRejectModal(true)}
                disabled={rejecting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition disabled:opacity-50"
              >
                Decline
              </button>
            </div>
          )}

          {/* Review Button - Show for completed tasks with accepted applications */}
          {application.status === 'accepted' && taskStatus === 'completed' && (
            <div className="ml-4">
              {hasReviewed ? (
                <div className="flex items-center gap-2 px-4 py-2 bg-green-100 border border-green-300 rounded-lg">
                  <span className="text-green-600">✅</span>
                  <span className="text-sm font-semibold text-green-800">Reviewed</span>
                </div>
              ) : (
                <button
                  onClick={() => onReview(task, application)}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg font-semibold hover:shadow-lg transition"
                >
                  ⭐ Leave Review
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <RejectModal
          taskerName={application.tasker?.full_name}
          onReject={handleReject}
          onClose={() => setShowRejectModal(false)}
          isRejecting={rejecting}
        />
      )}
    </>
  )
}

// Reject Modal Component
function RejectModal({ taskerName, onReject, onClose, isRejecting }: any) {
  const [customMessage, setCustomMessage] = useState('')

  const defaultMessages = [
    'Thank you for applying! We found someone with more specific experience for this task.',
    'We appreciate your application, but we have decided to go with another candidate whose rate better fits our budget.',
    'Thank you for your interest! We\'ve selected a tasker who is located closer to the job site.',
    'We appreciate your application. After reviewing all candidates, we have chosen to move forward with another tasker.',
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">
          Decline Application from {taskerName}
        </h3>

        <p className="text-gray-600 mb-4">
          We believe in treating everyone with kindness. Select a polite message to send:
        </p>

        <div className="space-y-2 mb-4">
          {defaultMessages.map((message, index) => (
            <button
              key={index}
              onClick={() => onReject(message)}
              disabled={isRejecting}
              className="w-full text-left p-3 border-2 border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition disabled:opacity-50"
            >
              <p className="text-sm text-gray-700">"{message}"</p>
            </button>
          ))}
        </div>

        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Or write a custom message:
          </label>
          <textarea
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            placeholder="Write a kind, professional message..."
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isRejecting}
            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onReject(customMessage)}
            disabled={isRejecting || (!customMessage.trim())}
            className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition disabled:opacity-50"
          >
            {isRejecting ? 'Sending...' : 'Send & Decline'}
          </button>
        </div>
      </div>
    </div>
  )
}
