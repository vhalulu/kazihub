'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function AdminVerificationsPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [profile, setProfile] = useState<any>(null)
  const [verifications, setVerifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending')
  const [selectedVerification, setSelectedVerification] = useState<any>(null)
  const [documentUrl, setDocumentUrl] = useState<string>('')
  const [showModal, setShowModal] = useState(false)
  const [rejectionNote, setRejectionNote] = useState('')
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    checkAdminAccess()
  }, [])

  useEffect(() => {
    if (profile) {
      loadVerifications()
    }
  }, [profile, filter])

  const checkAdminAccess = async () => {
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

      console.log('Profile data:', profileData)
      console.log('Is admin?', profileData?.is_admin)

      // Check if user is admin
      if (!profileData?.is_admin) {
        alert('⛔ Access denied. Admin only.')
        router.push('/dashboard')
        return
      }

      setProfile(profileData)
    } catch (error) {
      console.error('Auth check error:', error)
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const loadVerifications = async () => {
    try {
      let query = supabase
        .from('profiles')
        .select('*')
        .not('id_document_url', 'is', null)

      if (filter !== 'all') {
        query = query.eq('verification_status', filter)
      }

      query = query.order('verification_submitted_at', { ascending: false })

      const { data, error } = await query

      if (error) throw error

      setVerifications(data || [])
    } catch (error) {
      console.error('Error loading verifications:', error)
    }
  }

  const getSignedUrl = async (filePath: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('id-documents')
        .createSignedUrl(filePath, 3600) // Valid for 1 hour

      if (error) {
        console.error('Error creating signed URL:', error)
        return null
      }

      return data.signedUrl
    } catch (error) {
      console.error('Error in getSignedUrl:', error)
      return null
    }
  }

  const handleViewDocument = async (verification: any) => {
    setSelectedVerification(verification)
    setShowModal(true)
    setDocumentUrl('')

    // The id_document_url is already just the file path (e.g., "userId/id-document-timestamp.ext")
    // No need to extract - use it directly
    const filePath = verification.id_document_url
    
    console.log('Loading document from path:', filePath)
    
    const signedUrl = await getSignedUrl(filePath)
    if (signedUrl) {
      console.log('Signed URL created successfully')
      setDocumentUrl(signedUrl)
    } else {
      console.error('Failed to create signed URL for:', filePath)
      alert('Failed to load document. Please check console for details.')
    }
  }

  const handleApprove = async (verification: any) => {
    if (!confirm(`Approve verification for ${verification.full_name}?`)) {
      return
    }

    setProcessing(true)

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          verification_status: 'approved',
          verification_reviewed_at: new Date().toISOString(),
          is_verified: true,
        })
        .eq('id', verification.id)

      if (error) throw error

      alert('✅ Verification approved!')
      setShowModal(false)
      loadVerifications()
    } catch (error: any) {
      console.error('Error approving:', error)
      alert(error.message || 'Failed to approve verification')
    } finally {
      setProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!rejectionNote.trim()) {
      alert('⚠️ Please provide a reason for rejection')
      return
    }

    if (!confirm(`Reject verification for ${selectedVerification.full_name}?`)) {
      return
    }

    setProcessing(true)

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          verification_status: 'rejected',
          verification_reviewed_at: new Date().toISOString(),
          verification_notes: rejectionNote,
          is_verified: false,
        })
        .eq('id', selectedVerification.id)

      if (error) throw error

      alert('✅ Verification rejected')
      setShowModal(false)
      setRejectionNote('')
      loadVerifications()
    } catch (error: any) {
      console.error('Error rejecting:', error)
      alert(error.message || 'Failed to reject verification')
    } finally {
      setProcessing(false)
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
              <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">A</span>
              </div>
              <span className="text-xl font-bold text-white">KaziHub Admin</span>
            </Link>
            <Link href="/dashboard" className="text-sm text-gray-300 hover:text-white transition">
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">ID Verifications</h1>
          <p className="text-gray-600">Review and approve user identity documents</p>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-8 border border-gray-200">
          <div className="flex flex-wrap gap-2">
            {[
              { value: 'pending', label: 'Pending', color: 'amber' },
              { value: 'approved', label: 'Approved', color: 'green' },
              { value: 'rejected', label: 'Rejected', color: 'red' },
              { value: 'all', label: 'All', color: 'gray' },
            ].map(tab => (
              <button
                key={tab.value}
                onClick={() => setFilter(tab.value as any)}
                className={`px-6 py-2 rounded-lg font-semibold transition ${
                  filter === tab.value
                    ? tab.color === 'amber' ? 'bg-amber-600 text-white'
                    : tab.color === 'green' ? 'bg-green-600 text-white'
                    : tab.color === 'red' ? 'bg-red-600 text-white'
                    : 'bg-[#2c3e50] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Verifications List */}
        {verifications.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center border border-gray-200">
            <svg className="w-24 h-24 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No verifications found</h3>
            <p className="text-gray-600">No {filter === 'all' ? '' : filter} verifications at the moment</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {verifications.map(verification => (
              <div
                key={verification.id}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition border border-gray-200 overflow-hidden"
              >
                <div className="p-6">
                  {/* User Info */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-bold text-lg">
                      {verification.full_name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{verification.full_name}</h3>
                      <p className="text-sm text-gray-600">{verification.phone_number}</p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mb-4 ${
                    verification.verification_status === 'pending'
                      ? 'bg-amber-100 text-amber-800'
                      : verification.verification_status === 'approved'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {verification.verification_status?.toUpperCase()}
                  </div>

                  {/* Details */}
                  <div className="space-y-2 mb-4 text-sm">
                    <p><strong>ID Type:</strong> {verification.id_document_type?.replace('_', ' ')}</p>
                    <p><strong>Submitted:</strong> {new Date(verification.verification_submitted_at).toLocaleDateString('en-KE')}</p>
                    {verification.verification_reviewed_at && (
                      <p><strong>Reviewed:</strong> {new Date(verification.verification_reviewed_at).toLocaleDateString('en-KE')}</p>
                    )}
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={() => handleViewDocument(verification)}
                    className="w-full py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* Verification Modal */}
      {showModal && selectedVerification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full my-8">
            <div className="p-8">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Review Verification</h2>
                <button
                  onClick={() => {
                    setShowModal(false)
                    setRejectionNote('')
                    setDocumentUrl('')
                  }}
                  className="text-gray-400 hover:text-gray-600 text-3xl font-light"
                >
                  ×
                </button>
              </div>

              {/* User Info */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Full Name</p>
                    <p className="font-semibold text-gray-900">{selectedVerification.full_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Phone Number</p>
                    <p className="font-semibold text-gray-900">{selectedVerification.phone_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-semibold text-gray-900">{selectedVerification.email || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Account Type</p>
                    <p className="font-semibold text-gray-900 capitalize">{selectedVerification.user_type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">ID Document Type</p>
                    <p className="font-semibold text-gray-900 capitalize">{selectedVerification.id_document_type?.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Submitted At</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(selectedVerification.verification_submitted_at).toLocaleString('en-KE')}
                    </p>
                  </div>
                </div>
              </div>

              {/* ID Document */}
              <div className="mb-6">
                <h3 className="font-bold text-gray-900 mb-3">ID Document:</h3>
                <div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50">
                  {documentUrl ? (
                    selectedVerification.id_document_url?.endsWith('.pdf') ? (
                      <div className="text-center py-8">
                        <svg className="w-24 h-24 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        <p className="text-gray-600 mb-4">PDF Document</p>
                        <a
                          href={documentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          Open PDF in New Tab
                        </a>
                      </div>
                    ) : (
                      <div className="text-center">
                        <img
                          src={documentUrl}
                          alt="ID Document"
                          className="max-w-full h-auto rounded-lg mx-auto"
                          style={{ maxHeight: '600px' }}
                        />
                      </div>
                    )
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-gray-600">Loading document...</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Rejection Note Input (for pending verifications) */}
              {selectedVerification.verification_status === 'pending' && (
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Rejection Reason (optional if approving, required if rejecting)
                  </label>
                  <textarea
                    value={rejectionNote}
                    onChange={(e) => setRejectionNote(e.target.value)}
                    placeholder="e.g., Image is blurry, document is expired, name doesn't match..."
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              )}

              {/* Show existing notes if rejected */}
              {selectedVerification.verification_status === 'rejected' && selectedVerification.verification_notes && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm font-semibold text-red-900 mb-1">Rejection Reason:</p>
                  <p className="text-sm text-red-800">{selectedVerification.verification_notes}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowModal(false)
                    setRejectionNote('')
                    setDocumentUrl('')
                  }}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
                >
                  Close
                </button>
                {selectedVerification.verification_status === 'pending' && (
                  <>
                    <button
                      onClick={handleReject}
                      disabled={processing}
                      className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition disabled:opacity-50"
                    >
                      {processing ? 'Processing...' : 'Reject'}
                    </button>
                    <button
                      onClick={() => handleApprove(selectedVerification)}
                      disabled={processing}
                      className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50"
                    >
                      {processing ? 'Processing...' : 'Approve'}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
