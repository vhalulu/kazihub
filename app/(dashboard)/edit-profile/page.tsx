'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import ProfilePhotoUpload from '@/components/ProfilePhotoUpload'
import { COUNTIES, getTownsForCounty } from '@/lib/kenya-locations'

export default function EditProfilePage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sendingPasswordReset, setSendingPasswordReset] = useState(false)
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    county: '',
    town: '',
    bio: '',
  })
  const [availableTowns, setAvailableTowns] = useState<string[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    loadProfile()
  }, [])

  useEffect(() => {
    if (formData.county) {
      setAvailableTowns(getTownsForCounty(formData.county))
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

      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) throw error

      setProfile(profileData)
      setFormData({
        full_name: profileData.full_name || '',
        email: profileData.email || '',
        county: profileData.county || '',
        town: profileData.town || '',
        bio: profileData.bio || '',
      })

      // Set available towns if county is already selected
      if (profileData.county) {
        setAvailableTowns(getTownsForCounty(profileData.county))
      }
    } catch (error) {
      console.error('Error loading profile:', error)
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Full name is required'
    }

    if (!formData.county) {
      newErrors.county = 'County is required'
    }

    if (!formData.town) {
      newErrors.town = 'Town is required'
    }

    // Email validation (optional but must be valid if provided)
    if (formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address'
      }
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
          full_name: formData.full_name.trim(),
          email: formData.email.trim() || null,
          county: formData.county,
          town: formData.town,
          bio: formData.bio.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id)

      if (error) throw error

      alert('✅ Profile updated successfully!')
      router.push('/dashboard')
    } catch (error: any) {
      console.error('Error updating profile:', error)
      setErrors({ form: error.message || 'Failed to update profile' })
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordReset = async () => {
    const emailToUse = formData.email.trim() || profile.email

    if (!emailToUse) {
      alert('⚠️ Please add an email address to your profile first.')
      return
    }

    if (!confirm(`Send password reset link to ${emailToUse}?`)) {
      return
    }

    setSendingPasswordReset(true)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(emailToUse, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) throw error

      alert(`✅ Password reset link sent to ${emailToUse}! Check your email.`)
    } catch (error: any) {
      console.error('Password reset error:', error)
      alert(error.message || 'Failed to send password reset email')
    } finally {
      setSendingPasswordReset(false)
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
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Profile</h1>
          <p className="text-gray-600">Update your profile information</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          
          {/* Profile Photo Section */}
          <div className="mb-6 pb-6 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Profile Photo</h2>
            <ProfilePhotoUpload
              userId={profile.id}
              currentPhotoUrl={profile.profile_photo_url}
              onUploadSuccess={(url) => setProfile({ ...profile, profile_photo_url: url })}
            />
          </div>

          {/* Basic Info Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Basic Information</h2>
              
              {/* Verification Status */}
              {profile.is_verified ? (
                <div className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Verified
                </div>
              ) : profile.verification_status === 'pending' ? (
                <div className="flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-semibold">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Verification Pending
                </div>
              ) : (
                <Link 
                  href="/verify-identity"
                  className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold hover:bg-blue-200 transition"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Verify Identity
                </Link>
              )}
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="e.g., John Doe"
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
                  errors.full_name ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
              />
              {errors.full_name && (
                <p className="text-sm text-red-600 mt-1">{errors.full_name}</p>
              )}
            </div>

            {/* Phone Number - LOCKED */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={profile.phone_number}
                disabled
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
              />
              <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Phone number is locked for security. Contact support to change it.
              </p>
            </div>

            {/* Email - Optional */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address (Optional)
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="e.g., john@example.com"
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
                  errors.email ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
              />
              <p className="text-xs text-gray-500 mt-1">
                Add an email for password recovery and notifications
              </p>
              {errors.email && (
                <p className="text-sm text-red-600 mt-1">{errors.email}</p>
              )}
            </div>

            {/* Location - County and Town */}
            <div className="grid md:grid-cols-2 gap-4">
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
                    errors.county ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select county</option>
                  {COUNTIES.map(county => (
                    <option key={county} value={county}>{county}</option>
                  ))}
                </select>
                {errors.county && (
                  <p className="text-sm text-red-600 mt-1">{errors.county}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Town/Area *
                </label>
                <select
                  value={formData.town}
                  onChange={(e) => setFormData({ ...formData, town: e.target.value })}
                  disabled={!formData.county}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none disabled:bg-gray-100 disabled:cursor-not-allowed ${
                    errors.town ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select town</option>
                  {availableTowns.map(town => (
                    <option key={town} value={town}>{town}</option>
                  ))}
                </select>
                {errors.town && (
                  <p className="text-sm text-red-600 mt-1">{errors.town}</p>
                )}
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Bio / About You
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Tell others about yourself... (optional)"
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
              />
              <p className="text-sm text-gray-500 mt-1">
                {formData.bio.length} characters
              </p>
            </div>

            {/* Account Type Info */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm font-semibold text-gray-700 mb-1">Account Type</p>
              <p className="text-lg font-bold text-blue-600 capitalize">{profile.user_type}</p>
              <p className="text-xs text-gray-600 mt-1">
                To change your account type, please contact support
              </p>
            </div>

            {/* Password Change Section */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm font-semibold text-gray-700 mb-2">Password</p>
              <button
                type="button"
                onClick={handlePasswordReset}
                disabled={sendingPasswordReset}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sendingPasswordReset ? 'Sending...' : 'Send Password Reset Link'}
              </button>
              <p className="text-xs text-gray-600 mt-2">
                {formData.email.trim() || profile.email 
                  ? `Link will be sent to ${formData.email.trim() || profile.email}` 
                  : 'Add an email address above to reset your password'}
              </p>
            </div>

            {/* Error Message */}
            {errors.form && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
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
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>

          </form>
        </div>

      </div>
    </div>
  )
}
