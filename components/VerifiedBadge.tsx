interface VerifiedBadgeProps {
  isVerified: boolean
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
}

export default function VerifiedBadge({ isVerified, size = 'md', showText = false }: VerifiedBadgeProps) {
  if (!isVerified) return null

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl'
  }

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  }

  return (
    <div className="inline-flex items-center gap-1" title="Verified User">
      <span className={sizeClasses[size]}>✅</span>
      {showText && (
        <span className={`${textSizes[size]} font-semibold text-green-600`}>
          Verified
        </span>
      )}
    </div>
  )
}
