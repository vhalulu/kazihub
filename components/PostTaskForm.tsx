'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { COUNTIES, getTownsForCounty } from '@/lib/kenya-locations'
import { TASK_CATEGORY_GROUPS } from '@/lib/task-categories'

interface PostTaskFormProps {
  userProfile: any
  onSuccess?: () => void
}

export default function PostTaskForm({ userProfile, onSuccess }: PostTaskFormProps) {
  const supabase = createClient()

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
  const [availableTowns, setAvailableTowns] = useState<string[]>([])

  useEffect(() => {
    if (formData.county) {
      setAvailableTowns(getTownsForCounty(formData.county))
      setFormData(prev => ({ ...prev, town: '' }))
    } else {
      setAvailableTowns([])
    }
  }, [formData.county])

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
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          client_id: userProfile.id,
          title: formData.title,
          description: formData.description,
          category: formData.category,
          county: formData.county,
          town: formData.town,
          budget: Number(formData.budget),
          is_urgent: formData.isUrgent,
          has_insurance: formData.hasInsurance,
          max_applications: formData.maxApplications ? Number(formData.maxApplications) : null,
          status: 'open',
        })

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }

      alert('✅ Task posted successfully!')
      
      // Reset form
      setFormData({
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
      setErrors({})

      // Call success callback
      if (onSuccess) {
        onSuccess()
      }
    } catch (error: any) {
      console.error('Error posting task:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      alert(error?.message || error?.error_description || 'Failed to post task')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      
      {/* Debug Info - Remove after testing */}
      <div className="p-3 bg-gray-100 rounded text-xs">
        <strong>Debug:</strong> Selected Category: {formData.category || 'None'}
      </div>
      
      {/* Task Title */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Task Title *
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="e.g., Need a plumber to fix my sink"
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
            errors.title ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Description *
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Describe the task in detail..."
          rows={4}
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none ${
            errors.description ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
      </div>

      {/* Category Selection - Grouped Design */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          Category *
        </label>
        {errors.category && <p className="text-red-500 text-sm mb-3">{errors.category}</p>}
        
        <div className="space-y-6">
          {TASK_CATEGORY_GROUPS.map(group => (
            <div key={group.group} className="bg-blue-50 rounded-lg p-4 border border-blue-100">
              {/* Group Header */}
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">{group.icon}</span>
                <h3 className="text-lg font-bold text-gray-900">{group.group}</h3>
              </div>
              
              {/* Category Cards Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {group.categories.map(category => {
                  const isSelected = formData.category === category.value
                  return (
                    <div
                      key={category.value}
                      onClick={() => {
                        console.log('DIV Clicked category:', category.value)
                        setFormData({ ...formData, category: category.value })
                      }}
                      className={`p-4 rounded-lg border-2 transition hover:shadow-md cursor-pointer ${
                        isSelected
                          ? 'border-blue-500 bg-white shadow-md'
                          : 'border-gray-200 bg-white hover:border-blue-300'
                      }`}
                    >
                      <div className="text-3xl mb-2 pointer-events-none">{category.icon}</div>
                      <div className="text-sm font-semibold text-gray-900 text-center pointer-events-none">
                        {category.label}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Location */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            County *
          </label>
          <select
            value={formData.county}
            onChange={(e) => setFormData({ ...formData, county: e.target.value })}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
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
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
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
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Budget (KES) *
        </label>
        <input
          type="number"
          value={formData.budget}
          onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
          placeholder="e.g., 2000"
          min="0"
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
            errors.budget ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.budget && <p className="text-red-500 text-sm mt-1">{errors.budget}</p>}
      </div>

      {/* Max Applications */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Maximum Applications (Optional)
        </label>
        <input
          type="number"
          value={formData.maxApplications}
          onChange={(e) => setFormData({ ...formData, maxApplications: e.target.value })}
          placeholder="Leave blank for unlimited"
          min="1"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
        />
        <p className="text-xs text-gray-500 mt-1">
          Limit the number of applications you receive
        </p>
      </div>

      {/* Options */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          Additional Options
        </label>
        
        <div className="space-y-3">
          <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
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

          <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
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

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-4 bg-blue-600 text-white rounded-lg font-bold text-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Posting Task...' : 'Post Task →'}
      </button>
    </form>
  )
}
