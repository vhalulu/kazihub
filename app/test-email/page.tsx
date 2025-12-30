'use client'

import { useState } from 'react'

export default function TestEmailPage() {
  const [email, setEmail] = useState('')
  const [emailType, setEmailType] = useState('new_application')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')

  const testData: Record<string, any> = {
    new_application: {
      clientName: 'John Doe',
      taskerName: 'Jane Smith',
      taskTitle: 'Fix Kitchen Plumbing',
      proposedRate: 5000,
      taskUrl: 'http://localhost:3000/my-tasks'
    },
    application_accepted: {
      taskerName: 'Jane Smith',
      clientName: 'John Doe',
      taskTitle: 'Fix Kitchen Plumbing',
      agreedRate: 5000,
      taskUrl: 'http://localhost:3000/my-applications'
    },
    task_completed: {
      taskerName: 'Jane Smith',
      clientName: 'John Doe',
      taskTitle: 'Fix Kitchen Plumbing',
      reviewUrl: 'http://localhost:3000/my-applications'
    },
    new_message: {
      recipientName: 'Jane Smith',
      senderName: 'John Doe',
      messagePreview: 'Hi! I would like to discuss the task details with you...',
      conversationUrl: 'http://localhost:3000/messages/123'
    },
    review_received: {
      recipientName: 'Jane Smith',
      reviewerName: 'John Doe',
      rating: 5,
      comment: 'Excellent work! Very professional and completed the job perfectly.',
      taskTitle: 'Fix Kitchen Plumbing',
      profileUrl: 'http://localhost:3000/dashboard'
    }
  }

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    setError('')
    setResult(null)

    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to: email,
          type: emailType,
          data: testData[emailType]
        })
      })

      const data = await response.json()

      if (response.ok) {
        setResult(data)
        alert('✅ Email sent successfully! Check your inbox.')
      } else {
        setError(data.error || 'Failed to send email')
      }
    } catch (err: any) {
      setError(err.message || 'Network error')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 p-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            📧 Test Email Notifications
          </h1>
          <p className="text-gray-600 mb-8">
            Send test emails to verify your Resend integration is working
          </p>

          <form onSubmit={handleSendEmail} className="space-y-6">
            {/* Email Address */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Your Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your-email@example.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter your email to receive the test notification
              </p>
            </div>

            {/* Email Type */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Notification Type
              </label>
              <select
                value={emailType}
                onChange={(e) => setEmailType(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
              >
                <option value="new_application">📋 New Application (for Client)</option>
                <option value="application_accepted">🎉 Application Accepted (for Tasker)</option>
                <option value="task_completed">✅ Task Completed (for Tasker)</option>
                <option value="new_message">💬 New Message</option>
                <option value="review_received">⭐ Review Received</option>
              </select>
            </div>

            {/* Preview Data */}
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
              <p className="text-sm font-semibold text-gray-900 mb-2">📋 Test Data Preview:</p>
              <pre className="text-xs text-gray-700 overflow-auto">
                {JSON.stringify(testData[emailType], null, 2)}
              </pre>
            </div>

            {/* Send Button */}
            <button
              type="submit"
              disabled={sending}
              className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg transition disabled:opacity-50"
            >
              {sending ? 'Sending Email...' : '📤 Send Test Email'}
            </button>
          </form>

          {/* Success Result */}
          {result && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl">
              <h3 className="text-green-800 font-bold mb-2">✅ Email Sent Successfully!</h3>
              <p className="text-sm text-green-700">Message ID: {result.messageId}</p>
              <p className="text-sm text-green-700 mt-2">
                Check your inbox at <strong>{email}</strong>
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <h3 className="text-red-800 font-bold mb-2">❌ Error</h3>
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Instructions */}
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <h3 className="text-blue-900 font-bold mb-2">📋 How This Works:</h3>
            <ol className="text-sm text-blue-800 space-y-2">
              <li>1. Enter your email address above</li>
              <li>2. Select the type of notification to test</li>
              <li>3. Click "Send Test Email"</li>
              <li>4. Check your inbox (and spam folder)</li>
              <li>5. Email comes from: <strong>onboarding@resend.dev</strong></li>
            </ol>
          </div>

          {/* API Key Status */}
          <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-xl">
            <h3 className="text-purple-900 font-bold mb-2">🔑 Setup Checklist:</h3>
            <ul className="text-sm text-purple-800 space-y-1">
              <li>✅ Resend npm package installed</li>
              <li>✅ RESEND_API_KEY in .env.local</li>
              <li>✅ Email templates created</li>
              <li>✅ API route at /api/send-email</li>
              <li>✅ Using onboarding@resend.dev sender</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}