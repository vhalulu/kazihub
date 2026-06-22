'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

const ID_TYPES = [
  { value: 'national_id', label: 'National ID', icon: '🪪' },
  { value: 'passport', label: 'Passport', icon: '📘' },
  { value: 'drivers_license', label: "Driver's License", icon: '🚗' },
]

export default function VerifyIdentityPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [selectedIdType, setSelectedIdType] = useState('national_id')
  const [error, setError] = useState('')

  useEffect(() => {
    loadProfile()
  }, [])

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
    } catch (error) {
      console.error('Error loading profile:', error)
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
    if (!validTypes.includes(file.type)) {
      setError('Please upload a JPG, PNG, or PDF file')
      return
    }

    // Max 5MB
    if (file.size > 5 * 1024 * 1024) {
      setError('File must be less than 5MB')
      return
    }

    setUploading(true)
    setError('')

    try {
      // Create file path: userId/id-document.ext
      const fileExt = file.name.split('.').pop()
      const fileName = `${profile.id}/id-document-${Date.now()}.${fileExt}`

      // Delete old document if exists
      if (profile.id_document_url) {
        // Extract just the filename from the stored path
        const parts = profile.id_document_url.split('/')
        const oldFileName = parts[parts.length - 1]
        if (oldFileName) {
          await supabase.storage
            .from('id-documents')
            .remove([`${profile.id}/${oldFileName}`])
        }
      }

      // Upload new document
      const { error: uploadError } = await supabase.storage
        .from('id-documents')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      // Store just the file path (not a public URL)
      // Admin will generate signed URLs when viewing
      const filePath = fileName

      // Update profile with verification info
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          id_document_url: filePath, // Store path, not URL
          id_document_type: selectedIdType,
          verification_status: 'pending',
          verification_submitted_at: new Date().toISOString(),
          verification_reviewed_at: null,
          verification_notes: null,
          is_verified: false, // Will be set to true by admin
        })
        .eq('id', profile.id)

      if (updateError) throw updateError

      alert('✅ ID document uploaded successfully! Your verification is pending admin review.')
      loadProfile() // Reload to show updated status
      
    } catch (error: any) {
      console.error('Upload error:', error)
      setError(error.message || 'Failed to upload document')
    } finally {
      setUploading(false)
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

  // Check verification status
  const isPending = profile.verification_status === 'pending'
  const isApproved = profile.verification_status === 'approved' || profile.is_verified
  const isRejected = profile.verification_status === 'rejected'

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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Verify Your Identity</h1>
          <p className="text-gray-600">Upload a government-issued ID to get verified</p>
        </div>

        {/* Status Card - Show if already submitted */}
        {(isPending || isApproved || isRejected) && (
          <div className={`mb-8 p-6 rounded-lg border-2 ${
            isApproved 
              ? 'bg-green-50 border-green-200' 
              : isPending 
              ? 'bg-amber-50 border-amber-200'
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">
                {isApproved ? '✅' : isPending ? '⏳' : '❌'}
              </span>
              <h2 className="text-xl font-bold text-gray-900">
                {isApproved 
                  ? 'Verified!' 
                  : isPending 
                  ? 'Verification Pending'
                  : 'Verification Rejected'}
              </h2>
            </div>
            <p className={`text-sm ${
              isApproved ? 'text-green-800' : isPending ? 'text-amber-800' : 'text-red-800'
            }`}>
              {isApproved 
                ? 'Your identity has been verified. You now have a verified badge on your profile!' 
                : isPending 
                ? 'Your ID document is being reviewed by our team. This usually takes 24-48 hours.'
                : `Reason: ${profile.verification_notes || 'Please upload a clearer document and try again.'}`}
            </p>
            {profile.verification_submitted_at && (
              <p className="text-xs text-gray-600 mt-2">
                Submitted: {new Date(profile.verification_submitted_at).toLocaleDateString('en-KE', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            )}
          </div>
        )}

        {/* Upload Card */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          
          {/* Why Verify Section */}
          <div className="mb-8 pb-8 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Why Verify Your Identity?</h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <div>
                  <p className="font-semibold text-gray-900">Build Trust</p>
                  <p className="text-sm text-gray-600">Verified users are more trusted by clients and taskers</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                <div>
                  <p className="font-semibold text-gray-900">Stand Out</p>
                  <p className="text-sm text-gray-600">Get a verified badge on your profile</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <div>
                  <p className="font-semibold text-gray-900">Stay Safe</p>
                  <p className="text-sm text-gray-600">Helps prevent fraud and keeps everyone safe</p>
                </div>
              </div>
            </div>
          </div>

          {/* Upload Form */}
          {!isApproved && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-gray-900">
                {isPending || isRejected ? 'Re-upload Document' : 'Upload Your ID'}
              </h2>

              {/* ID Type Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Document Type *
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {ID_TYPES.map(type => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setSelectedIdType(type.value)}
                      className={`p-4 border-2 rounded-lg text-center transition ${
                        selectedIdType === type.value
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="text-3xl block mb-2">{type.icon}</span>
                      <span className={`text-sm font-semibold ${
                        selectedIdType === type.value ? 'text-blue-600' : 'text-gray-700'
                      }`}>
                        {type.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Upload Document *
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition">
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,application/pdf"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="hidden"
                    id="id-upload"
                  />
                  <label htmlFor="id-upload" className="cursor-pointer">
                    <svg className="w-16 h-16 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-lg font-semibold text-gray-900 mb-1">
                      {uploading ? 'Uploading...' : 'Click to upload'}
                    </p>
                    <p className="text-sm text-gray-600">
                      JPG, PNG, or PDF (max 5MB)
                    </p>
                  </label>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* Guidelines */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-semibold text-blue-900 mb-2">📋 Document Guidelines:</p>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Must be a clear, readable photo or scan</li>
                  <li>• All corners and text must be visible</li>
                  <li>• No blurry, cropped, or edited images</li>
                  <li>• Document must be valid (not expired)</li>
                  <li>• Must match your profile name</li>
                </ul>
              </div>

              {/* Privacy Notice */}
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-xs text-gray-600">
                  🔒 <strong>Privacy:</strong> Your ID document is stored securely and privately. 
                  Only KaziHub administrators can access it for verification purposes. 
                  It will never be shared publicly or with other users.
                </p>
              </div>
            </div>
          )}

          {/* Already Verified */}
          {isApproved && (
            <div className="text-center py-8">
              <svg className="w-24 h-24 mx-auto mb-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">You're All Set!</h2>
              <p className="text-gray-600 mb-6">
                Your identity is verified. You can now enjoy full access to KaziHub!
              </p>
              <Link 
                href="/dashboard"
                className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                Go to Dashboard
              </Link>
            </div>
          )}

        </div>

      </div>
    </div>
  )
}
