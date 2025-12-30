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

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.bio.trim()) newErrors.bio = 'Bio is required'
    if (formData.services_offered.length === 0) newErrors.services = 'Select at least one service'
    if (!formData.hourly_rate || Number(formData.hourly_rate) <= 0) newErrors.hourly_rate = 'Valid hourly rate is required'
    if (!formData.years_experience || Number(formData.years_experience) < 0) newErrors.years_experience = 'Years of experience is required'
    if (!formData.county) newErrors.county = 'County is required'
    if (!formData.town) newErrors.town = 'Town is required'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setSaving(true)

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          bio: formData.bio,
          services_offered: formData.services_offered,
          hourly_rate: Number(formData.hourly_rate),
          daily_rate: formData.daily_rate ? Number(formData.daily_rate) : null,
          years_experience: Number(formData.years_experience),
          is_available: formData.is_available,
          county: formData.county,
          town: formData.town,
        })
        .eq('id', profile.id)

      if (error) throw error

      alert('✅ Profile updated successfully!')
      router.push('/dashboard')
    } catch (error: any) {
      console.error('Error updating profile:', error)
      alert(error.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50/30 to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
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
        <div className="max-w-4xl mx-auto">
          
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Setup Tasker Profile</h1>
            <p className="text-gray-600">Tell clients about your skills and experience</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
            
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
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none ${
                  errors.bio ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.bio && <p className="text-red-500 text-sm mt-1">{errors.bio}</p>}
            </div>

            {/* Services Offered - GROUPED DISPLAY */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Services You Offer * <span className="text-gray-500 font-normal">({formData.services_offered.length} selected)</span>
              </label>
              {errors.services && <p className="text-red-500 text-sm mb-3">{errors.services}</p>}
              
              <div className="space-y-6 max-h-[500px] overflow-y-auto p-4 border border-gray-200 rounded-xl">
                {TASK_CATEGORY_GROUPS.map(group => (
                  <div key={group.group}>
                    {/* Group Header */}
                    <div className="flex items-center gap-2 mb-3 sticky top-0 bg-white py-2">
                      <span className="text-xl">{group.icon}</span>
                      <h3 className="text-md font-bold text-gray-900">{group.group}</h3>
                    </div>
                    
                    {/* Service Cards Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                      {group.categories.map(category => {
                        const isSelected = formData.services_offered.includes(category.value)
                        return (
                          <button
                            key={category.value}
                            type="button"
                            onClick={() => toggleService(category.value)}
                            className={`p-3 rounded-lg border-2 transition text-left ${
                              isSelected
                                ? 'border-blue-500 bg-blue-50 shadow-sm'
                                : 'border-gray-200 bg-white hover:border-blue-300'
                            }`}
                          >
                            <div className="text-2xl mb-1">{category.icon}</div>
                            <div className="text-xs font-semibold text-gray-900">
                              {category.label}
                            </div>
                          </button>
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
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
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
                  placeholder="e.g., 3000"
                  min="0"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
            </div>

            {/* Years of Experience */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Years of Experience *
              </label>
              <input
                type="number"
                value={formData.years_experience}
                onChange={(e) => setFormData({ ...formData, years_experience: e.target.value })}
                placeholder="e.g., 5"
                min="0"
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
                  errors.years_experience ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.years_experience && <p className="text-red-500 text-sm mt-1">{errors.years_experience}</p>}
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

            {/* Availability */}
            <div className="mb-8">
              <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_available}
                  onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <div>
                  <p className="font-semibold text-gray-900">✅ Available for Work</p>
                  <p className="text-sm text-gray-600">Let clients know you're ready to take on new tasks</p>
                </div>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={saving}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-blue-500/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving Profile...' : 'Save Profile'}
            </button>
          </form>

        </div>
      </div>
    </div>
  )
}
