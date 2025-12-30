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

    if (!validate()) return

    setSaving(true)
    setErrors({})

    try {
      // ✅ SECURITY: Check if email is already taken by another user
      if (formData.email.trim() && formData.email.trim() !== profile.email) {
        const { data: existingUsers, error: checkError } = await supabase
          .from('profiles')
          .select('id, full_name, phone_number')
          .eq('email', formData.email.trim())

        if (checkError) throw checkError

        // Filter out current user
        const otherUsers = existingUsers?.filter(u => u.id !== profile.id) || []

        if (otherUsers.length > 0) {
          setErrors({ 
            email: `This email is already used by another user (${otherUsers[0].phone_number}). Please use a different email.` 
          })
          setSaving(false)
          return
        }
      }

      // Update profile table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name.trim(),
          email: formData.email.trim() || null,
          county: formData.county,
          town: formData.town,
          bio: formData.bio.trim() || null,
        })
        .eq('id', profile.id)

      if (profileError) throw profileError

      // ✅ CRITICAL: Update Supabase Auth email if email was provided and changed
      // This ensures password reset emails go to the real email, not the synthetic one
      if (formData.email.trim() && formData.email.trim() !== profile.email) {
        const { error: authError } = await supabase.auth.updateUser({
          email: formData.email.trim()
        })

        if (authError) {
          console.error('Auth email update error:', authError)
          // Profile was saved, but auth email update failed
          alert('⚠️ Profile updated, but email verification is required. Please check your email inbox for a confirmation link to complete the email update.')
        } else {
          alert('✅ Profile updated! A verification email has been sent to your new email address. Please confirm it to enable password reset.')
        }
      } else {
        alert('✅ Profile updated successfully!')
      }

      router.push('/dashboard')
    } catch (error: any) {
      console.error('Error updating profile:', error)
      setErrors({ form: error.message || 'Failed to update profile' })
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordReset = async () => {
    if (!profile?.email && !formData.email.trim()) {
      alert('⚠️ Please add an email address first, then save your profile. After that, you can request a password reset.')
      return
    }

    const emailToUse = formData.email.trim() || profile.email

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
          <Link 
            href="/dashboard"
            className="text-gray-600 hover:text-gray-900 font-medium"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-2xl mx-auto">
          
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Edit Profile</h1>
            <p className="text-gray-600">Update your profile information</p>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
            
            {/* Profile Photo Section */}
            <div className="mb-8 pb-8 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Profile Photo</h2>
              <ProfilePhotoUpload
                userId={profile.id}
                currentPhotoUrl={profile.profile_photo_url}
                onUploadSuccess={(url) => setProfile({ ...profile, profile_photo_url: url })}
              />
            </div>

            {/* Basic Info Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              
              <h2 className="text-xl font-bold text-gray-900">Basic Information</h2>

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
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-100 text-gray-600 cursor-not-allowed"
                />
                <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                  🔒 Phone number is locked for security. Contact support to change it.
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
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
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
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
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
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none disabled:bg-gray-100 disabled:cursor-not-allowed ${
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                />
                <p className="text-sm text-gray-500 mt-1">
                  {formData.bio.length} characters
                </p>
              </div>

              {/* Account Type Info */}
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                <p className="text-sm font-semibold text-gray-900 mb-1">Account Type</p>
                <p className="text-lg font-bold text-blue-600 capitalize">{profile.user_type}</p>
                <p className="text-xs text-gray-600 mt-1">
                  To change your account type, please contact support
                </p>
              </div>

              {/* Password Change Section */}
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                <p className="text-sm font-semibold text-gray-900 mb-2">Password</p>
                <button
                  type="button"
                  onClick={handlePasswordReset}
                  disabled={sendingPasswordReset}
                  className="px-4 py-2 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
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
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-sm text-red-600">{errors.form}</p>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => router.push('/dashboard')}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>

            </form>
          </div>

        </div>
      </div>
    </div>
  )
}
