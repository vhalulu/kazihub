'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

const ID_TYPES = [
  { value: 'national_id', label: 'National ID', icon: '🪪' },
  { value: 'passport', label: 'Passport', icon: '📔' },
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50/30 to-slate-50 flex items-center justify-center">
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
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Verify Your Identity</h1>
            <p className="text-gray-600">Upload a government-issued ID to get verified</p>
          </div>

          {/* Status Card - Show if already submitted */}
          {(isPending || isApproved || isRejected) && (
            <div className={`mb-8 p-6 rounded-2xl border-2 ${
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
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
            
            {/* Why Verify Section */}
            <div className="mb-8 pb-8 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Why Verify Your Identity?</h2>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className="text-xl">🛡️</span>
                  <div>
                    <p className="font-semibold text-gray-900">Build Trust</p>
                    <p className="text-sm text-gray-600">Verified users are more trusted by clients and taskers</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-xl">⭐</span>
                  <div>
                    <p className="font-semibold text-gray-900">Stand Out</p>
                    <p className="text-sm text-gray-600">Get a verified badge on your profile</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-xl">🔒</span>
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
                <h2 className="text-xl font-bold text-gray-900">
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
                        className={`p-4 border-2 rounded-xl text-center transition ${
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
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition">
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,application/pdf"
                      onChange={handleFileUpload}
                      disabled={uploading}
                      className="hidden"
                      id="id-upload"
                    />
                    <label htmlFor="id-upload" className="cursor-pointer">
                      <div className="text-5xl mb-3">📤</div>
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
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                {/* Guidelines */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
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
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
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
                <span className="text-6xl block mb-4">🎉</span>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">You're All Set!</h2>
                <p className="text-gray-600 mb-6">
                  Your identity is verified. You can now enjoy full access to KaziHub!
                </p>
                <Link 
                  href="/dashboard"
                  className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-semibold hover:shadow-lg transition"
                >
                  Go to Dashboard
                </Link>
              </div>
            )}

          </div>

        </div>
      </div>
    </div>
  )
}
