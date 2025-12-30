'use client'

import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showBanner, setShowBanner] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    // Check if already installed
    const standalone = window.matchMedia('(display-mode: standalone)').matches
    setIsStandalone(standalone)

    if (standalone) {
      return // Don't show if already installed
    }

    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    setIsIOS(iOS)

    // Check if dismissed recently
    const dismissed = localStorage.getItem('pwa-install-dismissed')
    if (dismissed) {
      const hoursSinceDismissed = (Date.now() - parseInt(dismissed)) / (1000 * 60 * 60)
      if (hoursSinceDismissed < 168) { // 7 days
        return
      }
    }

    // Listen for install prompt (Android/Chrome/Edge)
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      
      // Show banner after 3 seconds (less aggressive)
      setTimeout(() => {
        setShowBanner(true)
      }, 3000)
    }

    window.addEventListener('beforeinstallprompt', handler)

    // For iOS, show instruction banner after 5 seconds
    if (iOS) {
      setTimeout(() => {
        setShowBanner(true)
      }, 5000)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    // Show install prompt
    deferredPrompt.prompt()

    // Wait for user choice
    const { outcome } = await deferredPrompt.userChoice
    
    console.log(`User ${outcome} the install prompt`)

    // Clear the prompt
    setDeferredPrompt(null)
    setShowBanner(false)

    if (outcome === 'dismissed') {
      localStorage.setItem('pwa-install-dismissed', Date.now().toString())
    }
  }

  const handleDismiss = () => {
    setShowBanner(false)
    localStorage.setItem('pwa-install-dismissed', Date.now().toString())
  }

  if (!showBanner || isStandalone) return null

  // iOS Install Instructions
  if (isIOS) {
    return (
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50 animate-slide-up">
        <div className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-2xl shadow-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 text-4xl">
              📱
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold mb-2">
                Install KaziHub
              </h3>
              <p className="text-sm text-cyan-50 mb-3">
                Tap the <strong>Share</strong> button <span className="inline-block">📤</span> below, then select <strong>"Add to Home Screen"</strong>
              </p>
              <button
                onClick={handleDismiss}
                className="w-full px-4 py-2 bg-cyan-700 text-white rounded-lg font-semibold hover:bg-cyan-800 transition"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Android/Desktop Install Prompt
  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50 animate-slide-up">
      <div className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-2xl shadow-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 text-4xl">
            📱
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold mb-2">
              Install KaziHub App
            </h3>
            <p className="text-sm text-cyan-50 mb-4">
              Get instant access! Install KaziHub on your device for a faster, app-like experience.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleInstall}
                className="flex-1 px-4 py-2 bg-white text-cyan-600 rounded-lg font-semibold hover:bg-cyan-50 transition"
              >
                Install Now
              </button>
              <button
                onClick={handleDismiss}
                className="px-4 py-2 bg-cyan-700 text-white rounded-lg font-semibold hover:bg-cyan-800 transition"
              >
                Later
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
