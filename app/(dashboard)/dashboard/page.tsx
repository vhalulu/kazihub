'use client'
import VerifiedBadge from '@/components/VerifiedBadge'
import NotificationBell from '@/components/NotificationBell'
import PWAInstallBanner from '@/components/PWAInstallBanner'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import ProfilePhotoUpload from '@/components/ProfilePhotoUpload'
import { getCategoryIcon } from '@/lib/task-categories'

export default function DashboardPage() {
  const router = useRouter()
  const supabase = createClient()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [featuredTasks, setFeaturedTasks] = useState<any[]>([])
  const [showPhoneNumber, setShowPhoneNumber] = useState(false)

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
          router.push('/edit-profile')
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 via-blue-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-cyan-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading your dashboard...</p>
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
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-purple-50">
      
      {/* Navigation */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/dashboard" className="flex items-center gap-2 group">
              <div className="text-3xl group-hover:scale-110 transition-transform">🔧</div>
              <span className="text-2xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 text-transparent bg-clip-text">
                KaziHub
              </span>
            </Link>

            <div className="flex items-center gap-6">
              <div className="hidden sm:flex items-center gap-2">
                <button
                  onClick={() => setShowPhoneNumber(!showPhoneNumber)}
                  className="text-sm text-gray-600 hover:text-cyan-600 transition flex items-center gap-2"
                >
                  <span>📱</span>
                  {showPhoneNumber ? (
                    <span className="font-mono">{profile.phone_number}</span>
                  ) : (
                    <span>Show Number</span>
                  )}
                </button>
              </div>

              <NotificationBell userId={profile.id} />

              <div className="hidden md:block text-sm">
                <span className="text-gray-600">Welcome, </span>
                <span className="font-semibold text-gray-900">{profile.full_name?.split(' ')[0]}</span>
              </div>

              <button
                onClick={handleSignOut}
                className="text-sm text-gray-600 hover:text-red-600 transition font-medium"
              >
                🚪 Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Profile */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              
              <div className="flex flex-col items-center mb-6">
                <ProfilePhotoUpload 
                  userId={profile.id}
                  currentPhotoUrl={profile.profile_photo_url}
                  onUploadSuccess={(url) => setProfile({...profile, profile_photo_url: url})}
                />
                
                <div className="text-center mt-4">
                  <h2 className="text-xl font-bold text-gray-900 mb-1 flex items-center justify-center gap-2">
                    {profile.full_name}
                    {profile.is_verified && <VerifiedBadge isVerified={profile.is_verified} size="md" />}
                  </h2>
                  <p className="text-sm font-medium text-cyan-600">{userTypeDisplay}</p>
                  {profile.rating && (
                    <p className="text-sm text-gray-600 mt-1">
                      ⭐ {profile.rating.toFixed(1)} ({profile.review_count || 0} reviews)
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">📍 {profile.town}, {profile.county}</p>
                </div>
              </div>

              <Link
                href="/edit-profile"
                className="block w-full text-center py-2 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm font-medium"
              >
                👤 Complete Profile
              </Link>
            </div>

            {/* What's Next Section */}
            <div className="mt-6 bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4">What's Next?</h3>
              
              {!profile.is_verified && profile.verification_status !== 'pending' && (
                <div className="mb-4 p-4 bg-amber-50 rounded-xl border border-amber-200">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">🔒</span>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 text-sm mb-1">Verify Your Account</h4>
                      <p className="text-xs text-gray-600 mb-3">Upload your government ID to get verified and build trust with other users</p>
                      <Link
                        href="/verify-identity"
                        className="inline-block px-4 py-2 bg-cyan-600 text-white text-sm rounded-lg font-semibold hover:bg-cyan-700 transition"
                      >
                        Get Verified →
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {profile.is_admin && (
                <div className="mb-4 p-4 bg-purple-50 rounded-xl border border-purple-200">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">👮</span>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 text-sm mb-1">Admin: ID Verifications</h4>
                      <p className="text-xs text-gray-600 mb-3">Review and approve user identity verification documents</p>
                      <Link
                        href="/admin/verifications"
                        className="inline-block px-4 py-2 bg-purple-600 text-white text-sm rounded-lg font-semibold hover:bg-purple-700 transition"
                      >
                        Review Verifications →
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Quick Actions */}
          <div className="lg:col-span-2">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              
              {(profile.user_type === 'client' || profile.user_type === 'both') && (
                <Link
                  href="/post-task"
                  className="group bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-4xl group-hover:scale-110 transition-transform">📋</div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white mb-1">Post a Task</h3>
                      <p className="text-sm text-blue-100">Need something done? Post a task and get quotes from trusted taskers in minutes.</p>
                    </div>
                  </div>
                </Link>
              )}

              {(profile.user_type === 'client' || profile.user_type === 'both') && (
                <Link
                  href="/my-tasks"
                  className="group bg-gradient-to-br from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-4xl group-hover:scale-110 transition-transform">📝</div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white mb-1">My Tasks</h3>
                      <p className="text-sm text-cyan-100">View your posted tasks and manage applications from taskers.</p>
                    </div>
                  </div>
                </Link>
              )}

              <Link
                href="/messages"
                className="group bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="flex items-center gap-4">
                  <div className="text-4xl group-hover:scale-110 transition-transform">💬</div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white mb-1">Messages</h3>
                    <p className="text-sm text-purple-100">Chat with clients and taskers. Keep all your conversations in one place and stay organized.</p>
                  </div>
                </div>
              </Link>

              {(profile.user_type === 'tasker' || profile.user_type === 'both') && (
                <Link
                  href="/browse-tasks"
                  className="group bg-gradient-to-br from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-4xl group-hover:scale-110 transition-transform">💼</div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white mb-1">Browse Available Tasks</h3>
                      <p className="text-sm text-teal-100">Looking for work? Browse tasks posted by clients near you. See descriptions, budgets, and apply!</p>
                    </div>
                  </div>
                </Link>
              )}

              {(profile.user_type === 'tasker' || profile.user_type === 'both') && (
                <Link
                  href="/my-applications"
                  className="group bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-4xl group-hover:scale-110 transition-transform">📬</div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white mb-1">My Applications</h3>
                      <p className="text-sm text-orange-100">Track your submitted task applications and see which ones got accepted.</p>
                    </div>
                  </div>
                </Link>
              )}

              {(profile.user_type === 'tasker' || profile.user_type === 'both') && (
                <Link
                  href="/edit-profile"
                  className="group bg-gradient-to-br from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-4xl group-hover:scale-110 transition-transform">⚙️</div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white mb-1">Setup Tasker Profile</h3>
                      <p className="text-sm text-indigo-100">Add your skills, set your rates, and make your first and best impression. Clients will see this!</p>
                    </div>
                  </div>
                </Link>
              )}
            </div>

            {/* Featured Tasks */}
            {(profile.user_type === 'tasker' || profile.user_type === 'both') && featuredTasks.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    🔥 Featured Tasks
                  </h3>
                  <Link 
                    href="/browse-tasks"
                    className="text-sm text-cyan-600 hover:text-cyan-700 font-semibold"
                  >
                    View all →
                  </Link>
                </div>

                <div className="space-y-4">
                  {featuredTasks.map((task) => (
                    <Link
                      key={task.id}
                      href="/browse-tasks"
                      className="block p-4 bg-gray-50 hover:bg-cyan-50 rounded-xl border border-gray-200 hover:border-cyan-300 transition group"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-2xl">{getCategoryIcon(task.category)}</span>
                            <h4 className="font-semibold text-gray-900 group-hover:text-cyan-700 transition truncate">
                              {task.title}
                            </h4>
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-2 mb-3">{task.description}</p>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              📍 {task.town}, {task.county}
                            </span>
                            <span className="flex items-center gap-1">
                              💰 Ksh {task.budget.toLocaleString()}
                            </span>
                            {task.is_urgent && (
                              <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full font-bold">
                                URGENT
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                {featuredTasks.length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">📋</div>
                    <p className="text-gray-500">No tasks available right now. Check back soon!</p>
                    <p className="text-sm text-gray-400 mt-2">💡 Tip: You can post tasks and apply for work to get started!</p>
                  </div>
                )}
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
