'use client'

import { useState } from 'react'

interface PhoneNumberProps {
  phoneNumber: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'compact'
}

export default function PhoneNumber({ phoneNumber, size = 'md', variant = 'default' }: PhoneNumberProps) {
  const [showPhone, setShowPhone] = useState(false)

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  }

  const buttonSizes = {
    sm: 'px-3 py-1 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2 text-base'
  }

  if (variant === 'compact') {
    return showPhone ? (
      <div className="flex items-center gap-2">
        <span className={`font-semibold text-gray-900 ${sizeClasses[size]}`}>
          📱 {phoneNumber}
        </span>
        <button
          onClick={() => setShowPhone(false)}
          className="text-xs text-gray-500 hover:text-gray-700 underline"
        >
          Hide
        </button>
      </div>
    ) : (
      <button
        onClick={() => setShowPhone(true)}
        className={`${buttonSizes[size]} bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition`}
      >
        Show Number
      </button>
    )
  }

  return (
    <div>
      {showPhone ? (
        <div className="flex items-center gap-3">
          <p className={`font-semibold text-gray-900 ${sizeClasses[size]}`}>
            📱 {phoneNumber}
          </p>
          <button
            onClick={() => setShowPhone(false)}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Hide
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowPhone(true)}
          className={`${buttonSizes[size]} bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg font-semibold hover:shadow-lg transition`}
        >
          📱 Show Phone Number
        </button>
      )}
    </div>
  )
}
