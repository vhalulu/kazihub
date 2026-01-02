'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { AuthInput } from '@/components/auth/AuthInput'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [formData, setFormData] = useState({
    phoneNumber: '',
    password: ''
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  
  // Forgot Password Modal State
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [resetPhoneNumber, setResetPhoneNumber] = useState('')
  const [sendingReset, setSendingReset] = useState(false)
  const [resetError, setResetError] = useState('')

  const formatPhoneNumber = (phone: string) => {
    let digits = phone.replace(/\D/g, '')
    
    if (digits.startsWith('0')) {
      digits = '254' + digits.slice(1)
    }
    
    if (!digits.startsWith('254')) {
      digits = '254' + digits
    }
    
    return '+' + digits
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate
    const newErrors: Record<string, string> = {}
    
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required'
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required'
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    
    setLoading(true)
    setErrors({})

    try {
      const formattedPhone = formatPhoneNumber(formData.phoneNumber)
      
      // ✅ SMART LOGIN: Check if user has a real email in their profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('phone_number', formattedPhone)
        .single()

      let loginEmail = ''
      
      // If user has updated their email, use that. Otherwise use phone-based email
      if (profile?.email) {
        loginEmail = profile.email
        console.log('Logging in with real email:', loginEmail)
      } else {
        // ✅ ORIGINAL FORMAT: 254726334592@kazihub.app
        const phoneDigits = formattedPhone.replace(/\+/g, '')
        loginEmail = `${phoneDigits}@kazihub.app`
        console.log('Logging in with phone-based email:', loginEmail)
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: formData.password
      })

      if (error) {
        console.error('Login error:', error)
        throw new Error('Invalid phone number or password')
      }

      console.log('Login successful!')
      router.push('/dashboard')
      router.refresh()
      
    } catch (error: any) {
      console.error('Login error:', error)
      setErrors({ form: error.message || 'Invalid phone number or password' })
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    if (!resetPhoneNumber.trim()) {
      setResetError('Please enter your phone number')
      return
    }

    setSendingReset(true)
    setResetError('')

    try {
      const formattedPhone = formatPhoneNumber(resetPhoneNumber)
      
      // Get user's profile to check if they have an email
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('phone_number', formattedPhone)
        .single()

      if (profileError || !profile) {
        setResetError('Phone number not found. Please check and try again.')
        setSendingReset(false)
        return
      }

      if (!profile.email) {
        setResetError('No email address on file. Please contact support at support@kazihub.app or call 0700123456 to reset your password.')
        setSendingReset(false)
        return
      }

      // Send password reset email
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(profile.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (resetError) throw resetError

      alert(`✅ Password reset link sent to ${profile.email}! Check your email inbox.`)
      setShowForgotPassword(false)
      setResetPhoneNumber('')
      
    } catch (error: any) {
      console.error('Password reset error:', error)
      setResetError(error.message || 'Failed to send reset email. Please try again.')
    } finally {
      setSendingReset(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50/30 to-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl"></div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              KaziHub
            </h1>
          </Link>
          <p className="text-gray-600">Welcome back!</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <form onSubmit={handleLogin} className="space-y-6">
            <AuthInput
              label="Phone Number"
              type="tel"
              placeholder="0712 345 678"
              value={formData.phoneNumber}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              error={errors.phoneNumber}
            />

            <div>
              <AuthInput
                label="Password"
                type="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                error={errors.password}
              />
              {/* Forgot Password Link */}
              <div className="text-right mt-2">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
            </div>

            {errors.form && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{errors.form}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Logging in...' : 'Log In'}
            </button>

            <div className="text-center space-y-3">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <Link href="/signup" className="text-blue-600 font-semibold hover:underline">
                  Sign Up
                </Link>
              </p>
            </div>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-6">
          By logging in, you agree to our Terms & Privacy Policy
        </p>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Reset Password</h2>
              <button
                onClick={() => {
                  setShowForgotPassword(false)
                  setResetPhoneNumber('')
                  setResetError('')
                }}
                className="text-gray-400 hover:text-gray-600 text-3xl font-light"
              >
                ×
              </button>
            </div>

            <p className="text-gray-600 mb-6">
              Enter your phone number. If you have an email on file, we'll send a password reset link to it.
            </p>

            <div className="space-y-4">
              <AuthInput
                label="Phone Number"
                type="tel"
                placeholder="0712 345 678"
                value={resetPhoneNumber}
                onChange={(e) => setResetPhoneNumber(e.target.value)}
              />

              {resetError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{resetError}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(false)
                    setResetPhoneNumber('')
                    setResetError('')
                  }}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={sendingReset}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendingReset ? 'Sending...' : 'Send Reset Link'}
                </button>
              </div>

              <p className="text-xs text-gray-500 text-center">
                💡 Don't have an email on file? Go to Edit Profile after logging in to add one.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
