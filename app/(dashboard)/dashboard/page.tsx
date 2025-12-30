'use client'
import VerifiedBadge from '@/components/VerifiedBadge'
import NotificationBell from '@/components/NotificationBell'
import PWAInstallBanner from '@/components/PWAInstallBanner'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import ProfilePhotoUpload from '@/components/ProfilePhotoUpload'
import { getCategoryIcon, getCategoryLabel } from '@/lib/task-categories'

export default function DashboardPage() {
  const router = useRouter()
  const supabase = createClient()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [featuredTasks, setFeaturedTasks] = useState<any[]>([])
  const [showPhoneNumber, setShowPhoneNumber] = useState(false)

  // Prefetch common routes on component mount for instant navigation
  useEffect(() => {
    router.prefetch('/post-task')
    router.prefetch('/my-tasks')
    router.prefetch('/browse-tasks')
    router.prefetch('/my-applications')
    router.prefetch('/messages')
    router.prefetch('/edit-profile')
    router.prefetch('/verify-identity')
    router.prefetch('/setup-profile')
  }, [router])

  useEffect(() => {
    loadUserProfile()
  }, [])

  const loadUserProfile = async () => {
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

      if (profileData) {
        setProfile(profileData)

        const isProfileComplete = 
          profileData.full_name &&
          profileData.phone_number &&
          profileData.county &&
          profileData.town &&
          profileData.user_type

        if (!isProfileComplete) {
          router.push('/setup-profile')
          return
        }

        if (profileData.user_type === 'tasker' || profileData.user_type === 'both') {
          loadFeaturedTasks(profileData.county)
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadFeaturedTasks = async (userCounty: string) => {
    try {
      const { data: tasks } = await supabase
        .from('tasks')
        .select(`
          *,
          client:profiles!tasks_client_id_fkey(full_name, rating, review_count)
        `)
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(10)

      if (tasks) {
        const availableTasks = tasks.filter(task => {
          if (!task.max_applications) return true
          return (task.applications || 0) < task.max_applications
        })

        const countyTasks = availableTasks.filter(t => t.county === userCounty)
        const otherTasks = availableTasks.filter(t => t.county !== userCounty)
        const sortedTasks = [...countyTasks, ...otherTasks]

        setFeaturedTasks(sortedTasks.slice(0, 5))
      }
    } catch (error) {
      console.error('Error loading featured tasks:', error)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 via-blue-50 to-purple-50 p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-b-4 border-cyan-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium text-sm sm:text-base">Loading...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return null
  }

  const userTypeDisplay = profile.user_type === 'both' 
    ? 'Tasker & Client' 
    : profile.user_type === 'tasker' 
      ? 'Tasker' 
      : 'Client'

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-purple-50 pb-20">
      
      {/* Mobile-Optimized Navigation */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="px-3 sm:px-6">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center gap-1.5 sm:gap-2">
              <div className="text-2xl sm:text-3xl">🔧</div>
              <span className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 text-transparent bg-clip-text">
                KaziHub
              </span>
            </Link>

            {/* Right Side */}
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Phone Number - Hidden on small screens */}
              <button
                onClick={() => setShowPhoneNumber(!showPhoneNumber)}
                className="hidden sm:flex text-xs sm:text-sm text-gray-600 hover:text-cyan-600 transition items-center gap-1.5"
              >
                <span>📱</span>
                {showPhoneNumber ? (
                  <span className="font-mono text-xs">{profile.phone_number}</span>
                ) : (
                  <span className="text-xs">Show #</span>
                )}
              </button>

              {/* Notification Bell */}
              {profile && <NotificationBell userId={profile.id} />}

              {/* Sign Out */}
              <button
                onClick={handleSignOut}
                className="text-xs sm:text-sm text-gray-600 hover:text-red-600 transition font-medium"
              >
                <span className="hidden sm:inline">🚪 Sign Out</span>
                <span className="sm:hidden">🚪</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Mobile Optimized */}
      <div className="px-3 sm:px-6 lg:px-8 py-4 sm:py-8 max-w-7xl mx-auto">
        
        {/* Mobile: Stack, Desktop: Grid */}
        <div className="space-y-6 lg:grid lg:grid-cols-3 lg:gap-8 lg:space-y-0">
          
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100">
              
              {/* Profile Photo - Smaller on mobile */}
              <div className="flex flex-col items-center mb-4 sm:mb-6">
                <div className="scale-90 sm:scale-100">
                  <ProfilePhotoUpload 
                    currentPhotoUrl={profile.profile_photo_url}
                    onUploadComplete={(url) => setProfile({...profile, profile_photo_url: url})}
                  />
                </div>
                
                <div className="text-center mt-3 sm:mt-4">
                  <h2 className="text-base sm:text-xl font-bold text-gray-900 mb-1 flex items-center justify-center gap-2">
                    <span className="truncate max-w-[200px]">{profile.full_name}</span>
                    {profile.is_verified && <VerifiedBadge size="sm" />}
                  </h2>
                  <p className="text-xs sm:text-sm font-medium text-cyan-600">{userTypeDisplay}</p>
                  {profile.rating && (
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">
                      ⭐ {profile.rating.toFixed(1)} ({profile.review_count || 0})
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1 sm:mt-2 truncate max-w-full px-2">
                    📍 {profile.town}, {profile.county}
                  </p>
                </div>
              </div>

              {/* Complete Profile Button */}
              <Link
                href="/edit-profile"
                className="block w-full text-center py-2 px-3 sm:px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-xs sm:text-sm font-medium"
              >
                👤 Complete Profile
              </Link>
            </div>

            {/* What's Next - Compact on mobile */}
            <div className="mt-4 sm:mt-6 bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">What's Next?</h3>
              
              {/* Verify Account */}
              {!profile.is_verified && profile.verification_status !== 'pending' && (
                <div className="mb-3 sm:mb-4 p-3 sm:p-4 bg-amber-50 rounded-lg sm:rounded-xl border border-amber-200">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <span className="text-xl sm:text-2xl flex-shrink-0">🔒</span>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 text-xs sm:text-sm mb-1">Verify Account</h4>
                      <p className="text-xs text-gray-600 mb-2 sm:mb-3">Get verified to build trust</p>
                      <Link
                        href="/verify-identity"
                        className="inline-block px-3 sm:px-4 py-1.5 sm:py-2 bg-cyan-600 text-white text-xs sm:text-sm rounded-lg font-semibold hover:bg-cyan-700 transition"
                      >
                        Get Verified →
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {/* Admin Panel */}
              {profile.is_admin && (
                <div className="mb-3 sm:mb-4 p-3 sm:p-4 bg-purple-50 rounded-lg sm:rounded-xl border border-purple-200">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <span className="text-xl sm:text-2xl flex-shrink-0">👮</span>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 text-xs sm:text-sm mb-1">Admin Panel</h4>
                      <p className="text-xs text-gray-600 mb-2 sm:mb-3">Review verifications</p>
                      <Link
                        href="/admin/verifications"
                        className="inline-block px-3 sm:px-4 py-1.5 sm:py-2 bg-purple-600 text-white text-xs sm:text-sm rounded-lg font-semibold hover:bg-purple-700 transition"
                      >
                        Review →
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions - Mobile Optimized */}
          <div className="lg:col-span-2">
            
            {/* Action Cards - Single column on mobile, 2 columns on tablet+ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
              
              {/* Post a Task */}
              {(profile.user_type === 'client' || profile.user_type === 'both') && (
                <Link
                  href="/post-task"
                  className="group bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all"
                >
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="text-3xl sm:text-4xl group-hover:scale-110 transition-transform flex-shrink-0">📋</div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm sm:text-lg font-bold text-white mb-0.5 sm:mb-1">Post a Task</h3>
                      <p className="text-xs sm:text-sm text-blue-100 line-clamp-2">Need something done? Get quotes from trusted taskers.</p>
                    </div>
                  </div>
                </Link>
              )}

              {/* My Tasks */}
              {(profile.user_type === 'client' || profile.user_type === 'both') && (
                <Link
                  href="/my-tasks"
                  className="group bg-gradient-to-br from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all"
                >
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="text-3xl sm:text-4xl group-hover:scale-110 transition-transform flex-shrink-0">📝</div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm sm:text-lg font-bold text-white mb-0.5 sm:mb-1">My Tasks</h3>
                      <p className="text-xs sm:text-sm text-cyan-100 line-clamp-2">View your tasks and manage applications.</p>
                    </div>
                  </div>
                </Link>
              )}

              {/* Messages */}
              <Link
                href="/messages"
                className="group bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all"
              >
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="text-3xl sm:text-4xl group-hover:scale-110 transition-transform flex-shrink-0">💬</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm sm:text-lg font-bold text-white mb-0.5 sm:mb-1">Messages</h3>
                    <p className="text-xs sm:text-sm text-purple-100 line-clamp-2">Chat with clients and taskers.</p>
                  </div>
                </div>
              </Link>

              {/* Browse Tasks */}
              {(profile.user_type === 'tasker' || profile.user_type === 'both') && (
                <Link
                  href="/browse-tasks"
                  className="group bg-gradient-to-br from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all"
                >
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="text-3xl sm:text-4xl group-hover:scale-110 transition-transform flex-shrink-0">💼</div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm sm:text-lg font-bold text-white mb-0.5 sm:mb-1">Browse Tasks</h3>
                      <p className="text-xs sm:text-sm text-teal-100 line-clamp-2">Find work near you and apply.</p>
                    </div>
                  </div>
                </Link>
              )}

              {/* My Applications */}
              {(profile.user_type === 'tasker' || profile.user_type === 'both') && (
                <Link
                  href="/my-applications"
                  className="group bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all"
                >
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="text-3xl sm:text-4xl group-hover:scale-110 transition-transform flex-shrink-0">📬</div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm sm:text-lg font-bold text-white mb-0.5 sm:mb-1">My Applications</h3>
                      <p className="text-xs sm:text-sm text-orange-100 line-clamp-2">Track your submitted applications.</p>
                    </div>
                  </div>
                </Link>
              )}

              {/* Edit Profile */}
              {(profile.user_type === 'tasker' || profile.user_type === 'both') && (
                <Link
                  href="/edit-profile"
                  className="group bg-gradient-to-br from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all"
                >
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="text-3xl sm:text-4xl group-hover:scale-110 transition-transform flex-shrink-0">⚙️</div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm sm:text-lg font-bold text-white mb-0.5 sm:mb-1">Edit Profile</h3>
                      <p className="text-xs sm:text-sm text-indigo-100 line-clamp-2">Update your skills and rates.</p>
                    </div>
                  </div>
                </Link>
              )}
            </div>

            {/* Featured Tasks - Mobile Optimized */}
            {(profile.user_type === 'tasker' || profile.user_type === 'both') && featuredTasks.length > 0 && (
              <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <h3 className="text-base sm:text-xl font-bold text-gray-900 flex items-center gap-2">
                    🔥 <span className="hidden xs:inline">Featured </span>Tasks
                  </h3>
                  <Link 
                    href="/browse-tasks"
                    className="text-xs sm:text-sm text-cyan-600 hover:text-cyan-700 font-semibold"
                  >
                    View all →
                  </Link>
                </div>

                <div className="space-y-3 sm:space-y-4">
                  {featuredTasks.map((task) => (
                    <Link
                      key={task.id}
                      href="/browse-tasks"
                      className="block p-3 sm:p-4 bg-gray-50 hover:bg-cyan-50 rounded-lg sm:rounded-xl border border-gray-200 hover:border-cyan-300 transition"
                    >
                      <div className="flex items-start gap-2 sm:gap-4">
                        <span className="text-xl sm:text-2xl flex-shrink-0">{getCategoryIcon(task.category)}</span>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 text-sm sm:text-base mb-1 sm:mb-2 truncate">
                            {task.title}
                          </h4>
                          <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 mb-2 sm:mb-3">{task.description}</p>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                            <span className="truncate max-w-[120px] sm:max-w-none">📍 {task.town}, {task.county}</span>
                            <span>💰 Ksh {task.budget.toLocaleString()}</span>
                            {task.is_urgent && (
                              <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full font-bold text-xs">
                                URGENT
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* PWA Install Banner */}
      <PWAInstallBanner />
    </div>
  )
}
