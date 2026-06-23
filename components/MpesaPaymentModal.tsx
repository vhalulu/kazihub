'use client';

import { useState } from 'react';

interface MpesaPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  amount: number;
  type: 'subscription' | 'verification' | 'task_payment';
  title: string;
  description: string;
  defaultPhone?: string;
}

// Format phone for display - convert +2547XX to 07XX or +2541XX to 01XX
function formatPhoneForDisplay(phone: string): string {
  if (!phone) return ''
  const cleaned = phone.replace(/\s/g, '')
  if (cleaned.startsWith('+254')) return '0' + cleaned.slice(4)
  if (cleaned.startsWith('254')) return '0' + cleaned.slice(3)
  return cleaned
}

// Format phone for MPesa API - convert 07XX to 2547XX
function formatPhoneForApi(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.startsWith('0')) return '254' + cleaned.slice(1)
  if (cleaned.startsWith('254')) return cleaned
  if (cleaned.startsWith('+254')) return cleaned.slice(1)
  return cleaned
}

export default function MpesaPaymentModal({
  isOpen,
  onClose,
  onSuccess,
  amount,
  type,
  title,
  description,
  defaultPhone = '',
}: MpesaPaymentModalProps) {
  const [phone, setPhone] = useState(formatPhoneForDisplay(defaultPhone))
  const [loading, setLoading] = useState(false)
  const [polling, setPolling] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  if (!isOpen) return null

  const handlePay = async () => {
    setError('')
    setMessage('')

    if (!phone || phone.length < 9) {
      setError('Please enter a valid phone number')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/payments/stk-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phone: formatPhoneForApi(phone), 
          amount, 
          type 
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Payment failed. Please try again.')
        setLoading(false)
        return
      }

      setMessage(data.message || 'Check your phone and enter your MPesa PIN')
      setLoading(false)
      setPolling(true)

      await pollStatus(data.transactionId)

    } catch (err) {
      setError('Network error. Please try again.')
      setLoading(false)
    }
  }

  const pollStatus = async (transactionId: string) => {
    const maxAttempts = 12
    let attempts = 0

    const poll = async () => {
      if (attempts >= maxAttempts) {
        setPolling(false)
        setError('Payment timeout. If you paid, please contact support.')
        return
      }

      attempts++

      try {
        const res = await fetch(`/api/payments/status?transactionId=${transactionId}`)
        const data = await res.json()

        if (data.transaction?.status === 'completed') {
          setPolling(false)
          setMessage('✅ Payment successful!')
          setTimeout(() => {
            onSuccess()
            onClose()
          }, 3000)
          return
        }

        if (data.transaction?.status === 'failed') {
          setPolling(false)
          setError('Payment was cancelled or failed. Please try again.')
          return
        }

        setTimeout(poll, 5000)
      } catch {
        setTimeout(poll, 5000)
      }
    }

    setTimeout(poll, 5000)
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          {!polling && (
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">
              &times;
            </button>
          )}
        </div>

        {/* Description */}
        <p className="text-gray-600 text-sm mb-6">{description}</p>

        {/* Amount */}
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 text-center">
          <p className="text-sm text-green-700 font-medium">Amount to pay</p>
          <p className="text-3xl font-bold text-green-700">KSh {amount.toLocaleString()}</p>
        </div>

        {/* Phone input */}
        {!polling && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              MPesa Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 0712345678"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">Enter your MPesa number (07XX or 01XX format)</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-4">
            {error}
          </div>
        )}

        {/* Success/Info message */}
        {message && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 rounded-xl px-4 py-3 text-sm mb-4">
            {message}
          </div>
        )}

        {/* Polling spinner */}
        {polling && (
          <div className="flex flex-col items-center py-4 mb-4">
            <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-sm text-gray-600 text-center">
              Waiting for payment confirmation...
              <br />
              <span className="text-xs text-gray-400">Enter your MPesa PIN on your phone</span>
            </p>
          </div>
        )}

        {/* Actions */}
        {!polling && (
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 border border-gray-300 text-gray-700 rounded-xl py-3 text-sm font-medium hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={handlePay}
              className="flex-1 bg-green-600 text-white rounded-xl py-3 text-sm font-medium hover:bg-green-700 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Sending...' : `Pay KSh ${amount.toLocaleString()}`}
            </button>
          </div>
        )}

        {/* MPesa note */}
        <p className="text-xs text-gray-400 text-center mt-4">
          🔒 Secured by Safaricom MPesa
        </p>
      </div>
    </div>
  )
}
