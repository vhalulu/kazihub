'use client'

import { UserType } from '@/types/database'

interface UserTypeSelectorProps {
  selected: UserType
  onChange: (type: UserType) => void
}

export function UserTypeSelector({ selected, onChange }: UserTypeSelectorProps) {
  const types = [
    {
      value: 'client' as UserType,
      label: 'Client',
      icon: '💼',
      description: 'I want to post tasks and hire taskers'
    },
    {
      value: 'tasker' as UserType,
      label: 'Tasker',
      icon: '⚡',
      description: 'I want to complete tasks and earn money'
    },
    {
      value: 'both' as UserType,
      label: 'Both',
      icon: '🔄',
      description: 'I want to post tasks AND complete tasks'
    }
  ]

  return (
    <div className="space-y-3">
      <label className="block text-sm font-semibold text-gray-700">
        I want to join as:
      </label>
      <div className="grid gap-3">
        {types.map((type) => (
          <button
            key={type.value}
            type="button"
            onClick={() => onChange(type.value)}
            className={`p-4 border-2 rounded-xl text-left transition-all ${
              selected === type.value
                ? 'border-blue-600 bg-blue-50 shadow-md'
                : 'border-gray-200 hover:border-blue-300'
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">{type.icon}</span>
              <div className="flex-1">
                <div className="font-semibold text-gray-900">{type.label}</div>
                <div className="text-sm text-gray-600">{type.description}</div>
              </div>
              {selected === type.value && (
                <span className="text-blue-600 font-bold">✓</span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}