'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { COUNTIES, getTownsForCounty } from '@/lib/kenya-locations'
import { TASK_CATEGORY_GROUPS } from '@/lib/task-categories'

export default function EditTaskPage() {
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()

  const [task, setTask] = useState<any>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    county: '',
    town: '',
    budget: '',
    isUrgent: false,
    hasInsurance: false,
    maxApplications: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [availableTowns, setAvailableTowns] = useState<string[]>([])
  const [initialLoading, setInitialLoading] = useState(true)

  useEffect(() => {
    checkUserAccessAndLoadTask()
  }, [params.id])

  useEffect(() => {
    if (formData.county) {
      setAvailableTowns(getTownsForCounty(formData.county))
    } else {
      setAvailableTowns([])
    }
  }, [formData.county])

  const checkUserAccessAndLoadTask = async () => {
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

      if (profile.user_type !== 'client' && profile.user_type !== 'both') {
        alert('Only clients can edit tasks')
        router.push('/dashboard')
        return
      }

      setUserProfile(profile)

      // Load the task
      const { data: taskData, error: taskError } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', params.id)
        .single()

      if (taskError || !taskData) {
        alert('Task not found')
        router.push('/my-tasks')
        return
      }

      // Verify user owns this task
      if (taskData.client_id !== user.id) {
        alert('You can only edit your own tasks')
        router.push('/my-tasks')
        return
      }

      // Check if task can be edited (only open tasks)
      if (taskData.status !== 'open') {
        alert('You can only edit tasks that are still open')
        router.push('/my-tasks')
        return
      }

      setTask(taskData)
      
      // Populate form with existing data
      setFormData({
        title: taskData.title,
        description: taskData.description,
        category: taskData.category,
        county: taskData.county,
        town: taskData.town,
        budget: taskData.budget.toString(),
        isUrgent: taskData.is_urgent || false,
        hasInsurance: taskData.has_insurance || false,
        maxApplications: taskData.max_applications ? taskData.max_applications.toString() : '',
      })

    } catch (error) {
      console.error('Error:', error)
      router.push('/my-tasks')
    } finally {
      setInitialLoading(false)
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) newErrors.title = 'Title is required'
    if (!formData.description.trim()) newErrors.description = 'Description is required'
    if (!formData.category) newErrors.category = 'Category is required'
    if (!formData.county) newErrors.county = 'County is required'
    if (!formData.town) newErrors.town = 'Town is required'
    if (!formData.budget || Number(formData.budget) <= 0) newErrors.budget = 'Valid budget is required'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          title: formData.title,
          description: formData.description,
          category: formData.category,
          county: formData.county,
          town: formData.town,
          budget: Number(formData.budget),
          is_urgent: formData.isUrgent,
          has_insurance: formData.hasInsurance,
          max_applications: formData.maxApplications ? Number(formData.maxApplications) : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', params.id)

      if (error) throw error

      alert('✅ Task updated successfully!')
      router.push('/my-tasks')
    } catch (error: any) {
      console.error('Error updating task:', error)
      alert(error.message || 'Failed to update task')
    } finally {
      setLoading(false)
    }
  }

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50/30 to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading task...</p>
        </div>
      </div>
    )
  }

  if (!task) return null

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
          <Link href="/my-tasks" className="text-gray-600 hover:text-gray-900 font-medium">
            ← Back to My Tasks
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Edit Task</h1>
            <p className="text-gray-600">Update your task details</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
            
            {/* Task Title */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Task Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Need a plumber to fix my sink"
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
                  errors.title ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
            </div>

            {/* Description */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the task in detail..."
                rows={4}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none ${
                  errors.description ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
            </div>

            {/* Category Selection */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Category *
              </label>
              {errors.category && <p className="text-red-500 text-sm mb-3">{errors.category}</p>}
              
              <div className="space-y-6">
                {TASK_CATEGORY_GROUPS.map(group => (
                  <div key={group.group}>
                    {/* Group Header */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-2xl">{group.icon}</span>
                      <h3 className="text-lg font-bold text-gray-900">{group.group}</h3>
                    </div>
                    
                    {/* Category Cards Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {group.categories.map(category => (
                        <button
                          key={category.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, category: category.value })}
                          className={`p-4 rounded-xl border-2 transition hover:shadow-md ${
                            formData.category === category.value
                              ? 'border-blue-500 bg-blue-50 shadow-md'
                              : 'border-gray-200 bg-white hover:border-blue-300'
                          }`}
                        >
                          <div className="text-3xl mb-2">{category.icon}</div>
                          <div className="text-sm font-semibold text-gray-900 text-center">
                            {category.label}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Location */}
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  County *
                </label>
                <select
                  value={formData.county}
                  onChange={(e) => setFormData({ ...formData, county: e.target.value, town: '' })}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
                    errors.county ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select County</option>
                  {COUNTIES.map(county => (
                    <option key={county} value={county}>{county}</option>
                  ))}
                </select>
                {errors.county && <p className="text-red-500 text-sm mt-1">{errors.county}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Town *
                </label>
                <select
                  value={formData.town}
                  onChange={(e) => setFormData({ ...formData, town: e.target.value })}
                  disabled={!formData.county}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
                    errors.town ? 'border-red-500' : 'border-gray-300'
                  } ${!formData.county ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                >
                  <option value="">Select Town</option>
                  {availableTowns.map(town => (
                    <option key={town} value={town}>{town}</option>
                  ))}
                </select>
                {errors.town && <p className="text-red-500 text-sm mt-1">{errors.town}</p>}
              </div>
            </div>

            {/* Budget */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Budget (KES) *
              </label>
              <input
                type="number"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                placeholder="e.g., 2000"
                min="0"
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
                  errors.budget ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.budget && <p className="text-red-500 text-sm mt-1">{errors.budget}</p>}
            </div>

            {/* Max Applications */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Maximum Applications (Optional)
              </label>
              <input
                type="number"
                value={formData.maxApplications}
                onChange={(e) => setFormData({ ...formData, maxApplications: e.target.value })}
                placeholder="Leave blank for unlimited"
                min="1"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                Limit the number of applications you receive
              </p>
            </div>

            {/* Options */}
            <div className="mb-8">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Additional Options
              </label>
              
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isUrgent}
                    onChange={(e) => setFormData({ ...formData, isUrgent: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                  <div>
                    <p className="font-semibold text-gray-900">🚀 Mark as Urgent</p>
                    <p className="text-sm text-gray-600">Get more attention from taskers</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.hasInsurance}
                    onChange={(e) => setFormData({ ...formData, hasInsurance: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <p className="font-semibold text-gray-900">🔒 Task is Insured</p>
                    <p className="text-sm text-gray-600">This task has insurance coverage</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => router.push('/my-tasks')}
                className="flex-1 py-4 border-2 border-gray-300 text-gray-700 rounded-xl font-bold text-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-blue-500/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving Changes...' : 'Save Changes'}
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  )
}
