'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { sendNotificationEmail } from '@/lib/send-notification-email'

interface ApplyModalProps {
  task: any
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  userProfile: any
}

export default function ApplyModal({ task, isOpen, onClose, onSuccess, userProfile }: ApplyModalProps) {
  const supabase = createClient()
  const [formData, setFormData] = useState({
    proposed_price: task.budget.toString(),
    message: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [applicationCount, setApplicationCount] = useState(0)
  const [loadingCount, setLoadingCount] = useState(true)

  useEffect(() => {
    if (isOpen && task) {
      fetchApplicationCount()
    }
  }, [isOpen, task])

  const fetchApplicationCount = async () => {
    try {
      setLoadingCount(true)
      const { count, error } = await supabase
        .from('task_applications')
        .select('*', { count: 'exact', head: true })
        .eq('task_id', task.id)

      if (error) throw error

      setApplicationCount(count || 0)
      
      // Immediately show error if applications are full
      if (task.max_applications && count && count >= task.max_applications) {
        setErrors({ 
          form: `This task has reached its application limit (${task.max_applications} applications). Applications are now closed.` 
        })
      }
    } catch (error) {
      console.error('Error fetching application count:', error)
    } finally {
      setLoadingCount(false)
    }
  }

  if (!isOpen) return null

  // Check if applications are full
  const isApplicationsFull = task.max_applications && applicationCount >= task.max_applications

  const validate = () => {
    const newErrors: Record<string, string> = {}

    const price = parseFloat(formData.proposed_price)
    if (!formData.proposed_price || isNaN(price) || price < 100) {
      newErrors.proposed_price = 'Price must be at least Ksh 100'
    }

    if (!formData.message.trim() || formData.message.length < 20) {
      newErrors.message = 'Message must be at least 20 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    setSubmitting(true)
    setErrors({})

    try {
      // Check if already applied
      const { data: existingApplication } = await supabase
        .from('task_applications')
        .select('id')
        .eq('task_id', task.id)
        .eq('tasker_id', userProfile.id)
        .single()

      if (existingApplication) {
        setErrors({ form: 'You have already applied to this task' })
        setSubmitting(false)
        return
      }

      // Check if max applications reached - DOUBLE CHECK BEFORE INSERTION
      if (task.max_applications) {
        const { count, error: countError } = await supabase
          .from('task_applications')
          .select('*', { count: 'exact', head: true })
          .eq('task_id', task.id)

        if (countError) throw countError

        if (count && count >= task.max_applications) {
          setErrors({ form: `This task has reached its application limit (${task.max_applications} applications maximum)` })
          setSubmitting(false)
          return
        }
      }

      // Create application
      const { error } = await supabase
        .from('task_applications')
        .insert({
          task_id: task.id,
          tasker_id: userProfile.id,
          proposed_price: parseFloat(formData.proposed_price),
          message: formData.message.trim(),
          status: 'pending',
        })

      if (error) throw error

      // ✅ Send email notification to client
      try {
        // Get client email and name
        const { data: clientData } = await supabase
          .from('profiles')
          .select('email, full_name')
          .eq('id', task.client_id)
          .single()

        if (clientData?.email) {
          await sendNotificationEmail(
            'new_application',
            clientData.email,
            {
              clientName: clientData.full_name,
              taskerName: userProfile.full_name,
              taskTitle: task.title,
              proposedRate: parseFloat(formData.proposed_price),
              taskUrl: `${window.location.origin}/my-tasks`
            }
          )
          console.log('✅ Email notification sent to client')
        }
      } catch (emailError) {
        // Don't fail the whole operation if email fails
        console.error('Failed to send email notification:', emailError)
      }

      onSuccess()
      onClose()
      alert('Application submitted successfully! 🎉')
    } catch (error: any) {
      console.error('Application error:', error)
      setErrors({ form: error.message || 'Failed to submit application' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Apply to Task</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-3xl font-light"
            >
              ×
            </button>
          </div>
        </div>

        {/* Task Summary */}
        <div className="p-6 bg-gray-50 border-b border-gray-200">
          <h3 className="font-bold text-lg text-gray-900 mb-2">{task.title}</h3>
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">{task.description}</p>
          <div className="flex items-center gap-4 text-sm flex-wrap">
            <span className="text-gray-600">📍 {task.town}, {task.county}</span>
            <span className="text-gray-600">💰 Budget: Ksh {task.budget.toLocaleString()}</span>
            {task.is_urgent && (
              <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">
                🚀 URGENT
              </span>
            )}
            {!loadingCount && (
              <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                isApplicationsFull 
                  ? 'bg-red-100 text-red-800' 
                  : 'bg-amber-100 text-amber-800'
              }`}>
                👥 {applicationCount}
                {task.max_applications ? ` / ${task.max_applications}` : ''} 
                {' '}{applicationCount === 1 ? 'applicant' : 'applicants'}
                {isApplicationsFull && ' - FULL'}
              </span>
            )}
          </div>
        </div>

        {/* Applications Full Warning */}
        {isApplicationsFull && (
          <div className="p-4 bg-red-50 border-b border-red-200">
            <p className="text-sm text-red-800 font-semibold">
              🚫 This task has reached its application limit ({task.max_applications} maximum). Applications are now closed.
            </p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            
            {/* Your Price */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Your Price (Ksh) *
              </label>
              <input
                type="number"
                value={formData.proposed_price}
                onChange={(e) => setFormData({ ...formData, proposed_price: e.target.value })}
                placeholder="e.g., 2000"
                min="100"
                disabled={isApplicationsFull}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none disabled:bg-gray-100 disabled:cursor-not-allowed ${
                  errors.proposed_price ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
              />
              <p className="text-sm text-gray-500 mt-1">
                Client's budget: Ksh {task.budget.toLocaleString()}
              </p>
              {errors.proposed_price && (
                <p className="text-sm text-red-600 mt-1">{errors.proposed_price}</p>
              )}
            </div>

            {/* Message to Client */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Message to Client *
              </label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Introduce yourself and explain why you're the best fit for this task..."
                rows={5}
                disabled={isApplicationsFull}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none resize-none disabled:bg-gray-100 disabled:cursor-not-allowed ${
                  errors.message ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
              />
              <p className="text-sm text-gray-500 mt-1">
                {formData.message.length} characters (minimum 20)
              </p>
              {errors.message && (
                <p className="text-sm text-red-600 mt-1">{errors.message}</p>
              )}
            </div>

            {/* Your Profile Summary */}
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
              <p className="text-sm font-semibold text-gray-900 mb-2">Your Profile Summary</p>
              <div className="text-sm text-gray-700 space-y-1">
                <p>⭐ Rating: {userProfile.rating?.toFixed(1) || 'New User'}</p>
                {userProfile.years_experience > 0 && (
                  <p>💼 Experience: {userProfile.years_experience} years</p>
                )}
                <p>📍 Location: {userProfile.town}, {userProfile.county}</p>
              </div>
            </div>

            {/* Competition Alert */}
            {applicationCount > 0 && !isApplicationsFull && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <p className="text-sm text-amber-800">
                  ⚡ <strong>{applicationCount} {applicationCount === 1 ? 'person has' : 'people have'} already applied.</strong> Submit a competitive offer and strong message to stand out!
                </p>
              </div>
            )}

            {/* Error Message */}
            {errors.form && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm text-red-600">{errors.form}</p>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition"
              >
                {isApplicationsFull ? 'Close' : 'Cancel'}
              </button>
              {!isApplicationsFull && (
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-cyan-500/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Submitting...' : 'Submit Application'}
                </button>
              )}
            </div>

          </div>
        </form>

      </div>
    </div>
  )
}