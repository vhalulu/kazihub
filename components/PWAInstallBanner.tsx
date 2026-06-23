'use client'

import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

// Shared state via module-level variable
let globalDeferredPrompt: BeforeInstallPromptEvent | null = null
let globalSetters: Array<(v: BeforeInstallPromptEvent | null) => void> = []

function setGlobalPrompt(prompt: BeforeInstallPromptEvent | null) {
  globalDeferredPrompt = prompt
  globalSetters.forEach(setter => setter(prompt))
}

// Install button for navbar
export function PWAInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(globalDeferredPrompt)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    setIsStandalone(window.matchMedia('(display-mode: standalone)').matches)
    globalSetters.push(setDeferredPrompt)
    return () => {
      globalSetters = globalSetters.filter(s => s !== setDeferredPrompt)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setGlobalPrompt(null)
    }
  }

  if (isStandalone || !deferredPrompt) return null

  return (
    <button
      onClick={handleInstall}
      className="text-sm text-gray-300 hover:text-white transition font-medium px-3 py-2 rounded-md hover:bg-[#34495e] flex items-center gap-2"
      title="Install KaziHub App"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
      <span className="hidden sm:inline">Install App</span>
    </button>
  )
}

// Main banner component
export default function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showBanner, setShowBanner] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches
    setIsStandalone(standalone)

    if (standalone) return

    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    setIsIOS(iOS)

    const dismissed = localStorage.getItem('pwa-install-dismissed')
    if (dismissed) {
      const hoursSinceDismissed = (Date.now() - parseInt(dismissed)) / (1000 * 60 * 60)
      if (hoursSinceDismissed < 168) return
    }

    const handler = (e: Event) => {
      e.preventDefault()
      const prompt = e as BeforeInstallPromptEvent
      setDeferredPrompt(prompt)
      setGlobalPrompt(prompt)
      setTimeout(() => setShowBanner(true), 3000)
    }

    window.addEventListener('beforeinstallprompt', handler)

    if (iOS) {
      setTimeout(() => setShowBanner(true), 5000)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    setDeferredPrompt(null)
    setGlobalPrompt(null)
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

  if (isIOS) {
    return (
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50">
        <div className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-2xl shadow-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 text-4xl">📱</div>
            <div className="flex-1">
              <h3 className="text-lg font-bold mb-2">Install KaziHub</h3>
              <p className="text-sm text-cyan-50 mb-3">
                Tap the <strong>Share</strong> button below, then select <strong>"Add to Home Screen"</strong>
              </p>
              <button onClick={handleDismiss} className="w-full px-4 py-2 bg-cyan-700 text-white rounded-lg font-semibold hover:bg-cyan-800 transition">
                Got it!
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50">
      <div className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-2xl shadow-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 text-4xl">📱</div>
          <div className="flex-1">
            <h3 className="text-lg font-bold mb-2">Install KaziHub App</h3>
            <p className="text-sm text-cyan-50 mb-4">
              Get instant access! Install KaziHub on your device for a faster, app-like experience.
            </p>
            <div className="flex gap-3">
              <button onClick={handleInstall} className="flex-1 px-4 py-2 bg-white text-cyan-600 rounded-lg font-semibold hover:bg-cyan-50 transition">
                Install Now
              </button>
              <button onClick={handleDismiss} className="px-4 py-2 bg-cyan-700 text-white rounded-lg font-semibold hover:bg-cyan-800 transition">
                Later
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
