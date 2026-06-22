'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { COUNTIES, getTownsForCounty } from '@/lib/kenya-locations'
import { TASK_CATEGORY_GROUPS } from '@/lib/task-categories'

export default function SetupProfilePage() {
  const router = useRouter()
  const supabase = createClient()

  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState({
    bio: '',
    services_offered: [] as string[],
    hourly_rate: '',
    daily_rate: '',
    years_experience: '',
    is_available: true,
    county: '',
    town: '',
  })

  const [availableTowns, setAvailableTowns] = useState<string[]>([])

  useEffect(() => {
    loadProfile()
  }, [])

  // Update available towns when county changes
  useEffect(() => {
    if (formData.county) {
      const towns = getTownsForCounty(formData.county)
      setAvailableTowns(towns)
    } else {
      setAvailableTowns([])
    }
  }, [formData.county])

  const loadProfile = async () => {
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

      if (!profileData) {
        router.push('/dashboard')
        return
      }

      // Check if user is a tasker
      if (profileData.user_type !== 'tasker' && profileData.user_type !== 'both') {
        alert('Only taskers can set up their profile')
        router.push('/dashboard')
        return
      }

      setProfile(profileData)

      // Pre-fill form if profile already exists
      setFormData({
        bio: profileData.bio || '',
        services_offered: profileData.services_offered || [],
        hourly_rate: profileData.hourly_rate?.toString() || '',
        daily_rate: profileData.daily_rate?.toString() || '',
        years_experience: profileData.years_experience?.toString() || '',
        is_available: profileData.is_available !== false,
        county: profileData.county || '',
        town: profileData.town || '',
      })

    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleService = (service: string) => {
    setFormData(prev => ({
      ...prev,
      services_offered: prev.services_offered.includes(service)
        ? prev.services_offered.filter(s => s !== service)
        : [...prev.services_offered, service]
    }))
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.bio.trim()) {
      newErrors.bio = 'Bio is required'
    }

    if (formData.services_offered.length === 0) {
      newErrors.services = 'Please select at least one service'
    }

    if (!formData.hourly_rate || Number(formData.hourly_rate) <= 0) {
      newErrors.hourly_rate = 'Hourly rate is required'
    }

    if (!formData.county) {
      newErrors.county = 'County is required'
    }

    if (!formData.town) {
      newErrors.town = 'Town is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) {
      return
    }

    setSaving(true)

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          bio: formData.bio.trim(),
          services_offered: formData.services_offered,
          hourly_rate: Number(formData.hourly_rate),
          daily_rate: formData.daily_rate ? Number(formData.daily_rate) : null,
          years_experience: formData.years_experience ? Number(formData.years_experience) : null,
          is_available: formData.is_available,
          county: formData.county,
          town: formData.town,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id)

      if (error) throw error

      alert('✅ Tasker profile updated successfully!')
      router.push('/dashboard')
    } catch (error: any) {
      console.error('Error updating profile:', error)
      setErrors({ form: error.message || 'Failed to update profile' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Setup Tasker Profile</h1>
          <p className="text-gray-600">Tell clients about your skills and experience</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          
          {/* Bio */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Bio / About You *
            </label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Tell clients about yourself, your experience, and what makes you great at what you do..."
              rows={4}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none ${
                errors.bio ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.bio && <p className="text-red-500 text-sm mt-1">{errors.bio}</p>}
          </div>

          {/* Services Offered - GROUPED DISPLAY WITH LIGHT BLUE BACKGROUNDS */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Services You Offer * <span className="text-gray-500 font-normal">({formData.services_offered.length} selected)</span>
            </label>
            {errors.services && <p className="text-red-500 text-sm mb-3">{errors.services}</p>}
            
            <div className="space-y-6 max-h-[500px] overflow-y-auto p-4 border border-gray-200 rounded-lg">
              {TASK_CATEGORY_GROUPS.map(group => (
                <div key={group.group} className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                  {/* Group Header */}
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-2xl">{group.icon}</span>
                    <h3 className="text-lg font-bold text-gray-900">{group.group}</h3>
                  </div>
                  
                  {/* Service Cards Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {group.categories.map(category => {
                      const isSelected = formData.services_offered.includes(category.value)
                      return (
                        <div
                          key={category.value}
                          onClick={() => {
                            console.log('Service clicked:', category.value)
                            toggleService(category.value)
                          }}
                          className={`p-3 rounded-lg border-2 transition text-left cursor-pointer ${
                            isSelected
                              ? 'border-blue-500 bg-white shadow-md'
                              : 'border-gray-200 bg-white hover:border-blue-300'
                          }`}
                        >
                          <div className="text-2xl mb-1 pointer-events-none">{category.icon}</div>
                          <div className="text-xs font-semibold text-gray-900 pointer-events-none">
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

          {/* Rates */}
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Hourly Rate (KES) *
              </label>
              <input
                type="number"
                value={formData.hourly_rate}
                onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })}
                placeholder="e.g., 500"
                min="0"
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
                  errors.hourly_rate ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.hourly_rate && <p className="text-red-500 text-sm mt-1">{errors.hourly_rate}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Daily Rate (KES) <span className="text-gray-500 font-normal">(Optional)</span>
              </label>
              <input
                type="number"
                value={formData.daily_rate}
                onChange={(e) => setFormData({ ...formData, daily_rate: e.target.value })}
                placeholder="e.g., 2000"
                min="0"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          {/* Years of Experience */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Years of Experience <span className="text-gray-500 font-normal">(Optional)</span>
            </label>
            <input
              type="number"
              value={formData.years_experience}
              onChange={(e) => setFormData({ ...formData, years_experience: e.target.value })}
              placeholder="e.g., 5"
              min="0"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>

          {/* Location */}
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                County *
              </label>
              <select
                value={formData.county}
                onChange={(e) => {
                  setFormData({ ...formData, county: e.target.value, town: '' })
                }}
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

          {/* Availability */}
          <div className="mb-8">
            <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_available}
                onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
                className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <div>
                <p className="font-semibold text-gray-900">✓ Available for Work</p>
                <p className="text-sm text-gray-600">Let clients know you're ready to take on new tasks</p>
              </div>
            </label>
          </div>

          {/* Error Message */}
          {errors.form && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-6">
              <p className="text-sm text-red-600">{errors.form}</p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>

        </form>

      </div>
    </div>
  )
}
