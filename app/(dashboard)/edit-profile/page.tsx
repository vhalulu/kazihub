'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import ProfilePhotoUpload from '@/components/ProfilePhotoUpload'
import SubscriptionPlans from '@/components/SubscriptionPlans'
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

    if (!confirm(`Send password reset link to ${emailToUse}?`)) return

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

  const isTasker = profile?.user_type === 'tasker' || profile?.user_type === 'both'

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* Navigation */}
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

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Profile</h1>
          <p className="text-gray-600">Update your profile information</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Profile Photo */}
            <div className="flex flex-col items-center pb-6 border-b border-gray-200">
              <ProfilePhotoUpload
                userId={profile.id}
                currentPhotoUrl={profile.profile_photo_url}
                onUploadSuccess={(url) => setProfile({...profile, profile_photo_url: url})}
              />
              <h2 className="text-xl font-bold text-gray-900 mt-4">{profile.full_name}</h2>
              <div className="flex items-center gap-2 mt-2">
                {profile.is_verified ? (
                  <div className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Verified
                  </div>
                ) : profile.verification_status === 'pending' ? (
                  <div className="flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-semibold">
                    Verification Pending
                  </div>
                ) : (
                  <Link href="/verify-identity" className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold hover:bg-blue-200 transition">
                    Verify Identity
                  </Link>
                )}
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name *</label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="e.g., John Doe"
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
                  errors.full_name ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
              />
              {errors.full_name && <p className="text-sm text-red-600 mt-1">{errors.full_name}</p>}
            </div>

            {/* Phone - Locked */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
              <input
                type="tel"
                value={profile.phone_number}
                disabled
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
              />
              <p className="text-xs text-amber-600 mt-1">Phone number is locked for security. Contact support to change it.</p>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address (Optional)</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="e.g., john@example.com"
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
                  errors.email ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
              />
              <p className="text-xs text-gray-500 mt-1">Add an email for password recovery and notifications</p>
              {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email}</p>}
            </div>

            {/* Location */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">County *</label>
                <select
                  value={formData.county}
                  onChange={(e) => setFormData({ ...formData, county: e.target.value, town: '' })}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
                    errors.county ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select county</option>
                  {COUNTIES.map(county => (
                    <option key={county} value={county}>{county}</option>
                  ))}
                </select>
                {errors.county && <p className="text-sm text-red-600 mt-1">{errors.county}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Town/Area *</label>
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
                {errors.town && <p className="text-sm text-red-600 mt-1">{errors.town}</p>}
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Bio / About You</label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Tell others about yourself... (optional)"
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
              />
              <p className="text-sm text-gray-500 mt-1">{formData.bio.length} characters</p>
            </div>

            {/* Account Type */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm font-semibold text-gray-700 mb-1">Account Type</p>
              <p className="text-lg font-bold text-blue-600 capitalize">{profile.user_type}</p>
              <p className="text-xs text-gray-600 mt-1">To change your account type, please contact support</p>
            </div>

            {/* Password */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm font-semibold text-gray-700 mb-2">Password</p>
              <button
                type="button"
                onClick={handlePasswordReset}
                disabled={sendingPasswordReset}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition disabled:opacity-50"
              >
                {sendingPasswordReset ? 'Sending...' : 'Send Password Reset Link'}
              </button>
              <p className="text-xs text-gray-600 mt-2">
                {formData.email.trim() || profile.email
                  ? `Link will be sent to ${formData.email.trim() || profile.email}`
                  : 'Add an email address above to reset your password'}
              </p>
            </div>

            {errors.form && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{errors.form}</p>
              </div>
            )}

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
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>

          </form>
        </div>

        {/* Subscription Section - Only for Taskers */}
        {isTasker && (
          <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">KaziHub Pro</h2>
                <p className="text-sm text-gray-600">Unlimited task applications</p>
              </div>
            </div>

            <SubscriptionPlans
              userId={profile.id}
              userPhone={profile.phone_number}
              isPro={profile.is_pro_tasker}
              onSuccess={() => setProfile({...profile, is_pro_tasker: true})}
            />
          </div>
        )}

      </div>
    </div>
  )
}
