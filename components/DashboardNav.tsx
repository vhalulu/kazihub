'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import NotificationBell from './NotificationBell'

interface DashboardNavProps {
  profile: any
  onSignOut: () => void
}

export default function DashboardNav({ profile, onSignOut }: DashboardNavProps) {
  const pathname = usePathname()

  const isClient = profile.user_type === 'client' || profile.user_type === 'both'
  const isTasker = profile.user_type === 'tasker' || profile.user_type === 'both'

  // Desktop tabs (top navigation)
  const desktopTabs = [
    { name: 'Home', href: '/dashboard', icon: '🏠' },
    ...(isClient ? [{ name: 'My Tasks', href: '/my-tasks', icon: '📝' }] : []),
    ...(isTasker ? [{ name: 'Browse Tasks', href: '/browse-tasks', icon: '🔍' }] : []),
    ...(isTasker ? [{ name: 'Applications', href: '/my-applications', icon: '📬' }] : []),
    { name: 'Messages', href: '/messages', icon: '💬' },
    { name: 'Profile', href: '/edit-profile', icon: '👤' },
  ]

  // Mobile bottom tabs (simplified)
  const mobileTabs = [
    { name: 'Home', href: '/dashboard', icon: '🏠' },
    ...(isTasker ? [{ name: 'Tasks', href: '/browse-tasks', icon: '🔍' }] : []),
    ...(isClient ? [{ name: 'My Tasks', href: '/my-tasks', icon: '📝' }] : []),
    { name: 'Messages', href: '/messages', icon: '💬' },
    { name: 'Profile', href: '/edit-profile', icon: '👤' },
  ]

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname.startsWith(href)
  }

  return (
    <>
      {/* Top Navigation Bar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 md:h-16">
            
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xl md:text-2xl">🔧</span>
              <span className="text-lg md:text-xl font-bold text-gray-900">KaziHub</span>
            </Link>

            {/* Desktop Tabs - Hidden on mobile */}
            <div className="hidden md:flex items-center gap-1">
              {desktopTabs.map((tab) => (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive(tab.href)
                      ? 'bg-cyan-50 text-cyan-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <span className="mr-1.5">{tab.icon}</span>
                  {tab.name}
                </Link>
              ))}
            </div>

            {/* Right Side - Desktop */}
            <div className="hidden md:flex items-center gap-4">
              <NotificationBell userId={profile.id} />
              
              <button
                onClick={onSignOut}
                className="text-sm font-medium text-gray-600 hover:text-red-600 transition"
              >
                Sign Out
              </button>
            </div>

            {/* Right Side - Mobile (just notification) */}
            <div className="md:hidden">
              <NotificationBell userId={profile.id} />
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation - Sticky at bottom */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-bottom">
        <div className="flex items-center justify-around px-2 py-2">
          {mobileTabs.slice(0, 5).map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center justify-center px-3 py-2 min-w-[60px] rounded-lg transition-colors ${
                isActive(tab.href)
                  ? 'text-cyan-600'
                  : 'text-gray-500'
              }`}
            >
              <span className="text-2xl mb-0.5">{tab.icon}</span>
              <span className={`text-xs font-medium ${
                isActive(tab.href) ? 'text-cyan-600' : 'text-gray-600'
              }`}>
                {tab.name}
              </span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Bottom spacing for mobile content (so content doesn't hide behind bottom nav) */}
      <div className="md:hidden h-16"></div>
    </>
  )
}
