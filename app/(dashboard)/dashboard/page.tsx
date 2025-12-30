'use client'
import VerifiedBadge from '@/components/VerifiedBadge'
import NotificationBell from '@/components/NotificationBell'
import PWAInstallPrompt from '@/components/PWAInstallPrompt'
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
  const [tasksLoading, setTasksLoading] = useState(true)
  const [showPhone, setShowPhone] = useState(false)

  useEffect(() => {
    loadProfile()
  }, [])

  useEffect(() => {
    if (profile && (profile.user_type === 'tasker' || profile.user_type === 'both')) {
      loadFeaturedTasks()
    }
  }, [profile])

  const loadProfile = async () => {
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

      setProfile(profileData)
    } catch (error) {
      console.error('Error loading profile:', error)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const loadFeaturedTasks = async () => {
    try {
      setTasksLoading(true)
      
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          client:profiles!tasks_client_id_fkey(full_name, rating, is_verified),
          applications:task_applications(count)
        `)
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(10) // Fetch more to filter out full ones

      if (error) throw error

      // Filter out full tasks and limit to 5
      const availableTasks = (data || []).filter(task => {
        const applicationCount = task.applications?.[0]?.count || 0
        const maxApplications = task.max_applications
        const isFull = maxApplications && applicationCount >= maxApplications
        return !isFull // Only show tasks that aren't full
      }).slice(0, 5)

      setFeaturedTasks(availableTasks)
    } catch (error) {
      console.error('Error loading featured tasks:', error)
    } finally {
      setTasksLoading(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const isNewAccount = () => {
    // Check if URL has ?new=true parameter
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search)
      return searchParams.get('new') === 'true'
    }
    return false
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50/30 to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50/30 to-slate-50">
      {/* Top Navigation */}
      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-lg"></div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              KaziHub
            </span>
          </div>
          
          <div className="flex items-center gap-6">
            {/* Phone Number */}
            <div className="flex items-center gap-2">
              {showPhone ? (
                <>
                  <span className="text-sm font-semibold text-gray-700">
                    📱 {profile?.phone_number}
                  </span>
                  <button
                    onClick={() => setShowPhone(false)}
                    className="text-xs text-gray-500 hover:text-gray-700 underline"
                  >
                    Hide
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setShowPhone(true)}
                  className="px-3 py-1.5 bg-cyan-600 text-white text-sm rounded-lg font-semibold hover:bg-cyan-700 transition"
                >
                  📱 Show Number
                </button>
              )}
            </div>

            {/* Notification Bell */}
            <NotificationBell userId={profile.id} />

            {/* Welcome User */}
            <span className="text-gray-700">
              Welcome, <span className="font-semibold">{profile?.full_name || 'User'}</span>
            </span>

            {/* Sign Out Button */}
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg font-medium hover:bg-red-100 transition"
            >
              <span>🚪</span>
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          
          {/* Welcome Card */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-gray-100">
            <div className="flex items-start gap-6 mb-6">
              {/* Left Side: Profile Photo + Complete Profile */}
              <div className="flex flex-col items-center gap-3">
                <ProfilePhotoUpload
                  userId={profile.id}
                  currentPhotoUrl={profile.profile_photo_url}
                  onUploadSuccess={(url) => setProfile({ ...profile, profile_photo_url: url })}
                />
                
                {/* Complete Profile Card - Small */}
                <div 
                  onClick={() => router.push('/edit-profile')}
                  className="w-48 p-3 bg-slate-50 border-2 border-slate-200 rounded-xl hover:border-slate-400 transition cursor-pointer"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">👤</span>
                    <p className="text-sm font-bold text-gray-900">Complete Profile</p>
                  </div>
                  <p className="text-xs text-gray-600">Add more details</p>
                </div>
              </div>
              
              {/* Center: Welcome Text */}
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-3">
                  {isNewAccount() ? 'Welcome to KaziHub! 🎉' : `Welcome back, ${profile?.full_name?.split(' ')[0] || 'User'}! 👋`}
                </h1>
                
                {/* Verification Status + Account Type - Inline */}
                <div className="flex items-center gap-3 mb-3">
                  {profile?.is_verified ? (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="text-green-600 text-xl">✓</span>
                        <span className="text-sm font-semibold text-green-700">Verified</span>
                      </div>
                      <span className="text-gray-300">•</span>
                    </>
                  ) : profile?.verification_status === 'pending' ? (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="text-amber-600 text-xl">⏳</span>
                        <span className="text-sm font-semibold text-amber-700">Pending Verification</span>
                      </div>
                      <span className="text-gray-300">•</span>
                    </>
                  ) : null}
                  
                  <span className="text-lg font-semibold text-blue-600 capitalize">
                    {profile?.user_type === 'both' ? 'Tasker & Client' : profile?.user_type}
                  </span>
                </div>

                <p className="text-gray-600">
                  {isNewAccount() 
                    ? 'Your account has been created successfully' 
                    : 'Ready to get things done today?'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Next Steps Card */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">What's Next?</h2>
            
            {/* 2-column grid on desktop, 1 column on mobile */}
            <div className="grid md:grid-cols-2 gap-4">
              
              {/* Verify Your Account - Only for unverified users */}
              {!profile?.is_verified && profile?.verification_status !== 'pending' && (
                <div 
                  onClick={() => router.push('/verify-identity')}
                  className="p-6 border-2 border-blue-200 bg-blue-50 rounded-xl hover:border-blue-400 transition cursor-pointer"
                >
                  <h3 className="text-xl font-bold text-gray-900 mb-2">🔒 Verify Your Account</h3>
                  <p className="text-gray-600 mb-4">
                    Upload your government ID to get verified and build trust with other users
                  </p>
                  <span className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition">
                    Get Verified →
                  </span>
                </div>
              )}

              {/* Admin Card - Full width if shown */}
              {profile?.is_admin && (
                <div 
                  onClick={() => router.push('/admin/verifications')}
                  className="p-6 border-2 border-purple-200 bg-purple-50 rounded-xl hover:border-purple-400 transition cursor-pointer md:col-span-2"
                >
                  <h3 className="text-xl font-bold text-gray-900 mb-2">👨‍💼 Admin: ID Verifications</h3>
                  <p className="text-gray-600 mb-4">
                    Review and approve user identity verification documents
                  </p>
                  <span className="inline-block px-6 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition">
                    Review Verifications →
                  </span>
                </div>
              )}

              {(profile?.user_type === 'client' || profile?.user_type === 'both') && (
                <div 
                  onClick={() => router.push('/post-task')}
                  className="p-6 border-2 border-blue-200 rounded-xl hover:border-blue-400 transition cursor-pointer"
                >
                  <h3 className="text-xl font-bold text-gray-900 mb-2">📝 Post a Task</h3>
                  <p className="text-gray-600 mb-4">
                    Need something done? Post a task and get quotes from trusted taskers in minutes.
                  </p>
                  <span className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition">
                    Post a Task →
                  </span>
                </div>
              )}

              {(profile?.user_type === 'client' || profile?.user_type === 'both') && (
                <div 
                  onClick={() => router.push('/my-tasks')}
                  className="p-6 border-2 border-indigo-200 rounded-xl hover:border-indigo-400 transition cursor-pointer"
                >
                  <h3 className="text-xl font-bold text-gray-900 mb-2">📋 My Tasks</h3>
                  <p className="text-gray-600 mb-4">
                    View your posted tasks and manage applications from taskers.
                  </p>
                  <span className="inline-block px-6 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition">
                    Manage Tasks →
                  </span>
                </div>
              )}

              {(profile?.user_type === 'client' || profile?.user_type === 'both') && (
                <div 
                  onClick={() => router.push('/browse-taskers')}
                  className="p-6 border-2 border-green-200 rounded-xl hover:border-green-400 transition cursor-pointer"
                >
                  <h3 className="text-xl font-bold text-gray-900 mb-2">👷 Browse Taskers</h3>
                  <p className="text-gray-600 mb-4">
                    Find and book verified professionals directly. Browse by service, location, and rating.
                  </p>
                  <span className="inline-block px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition">
                    Find Taskers →
                  </span>
                </div>
              )}

              {/* Messages Card - Available to Everyone */}
              <div 
                onClick={() => router.push('/messages')}
                className="p-6 border-2 border-pink-200 rounded-xl hover:border-pink-400 transition cursor-pointer"
              >
                <h3 className="text-xl font-bold text-gray-900 mb-2">💬 Messages</h3>
                <p className="text-gray-600 mb-4">
                  Chat with clients and taskers. Keep all your conversations in one place.
                </p>
                <span className="inline-block px-6 py-2 bg-pink-600 text-white rounded-lg font-semibold hover:bg-pink-700 transition">
                  View Messages →
                </span>
              </div>

              {(profile?.user_type === 'tasker' || profile?.user_type === 'both') && (
                <div 
                  onClick={() => router.push('/browse-tasks')}
                  className="p-6 border-2 border-cyan-200 rounded-xl hover:border-cyan-400 transition cursor-pointer"
                >
                  <h3 className="text-xl font-bold text-gray-900 mb-2">🔍 Browse Available Tasks</h3>
                  <p className="text-gray-600 mb-4">
                    Find tasks in your area. Apply with your price. Get hired. Keep 100% of what you earn.
                  </p>
                  <span className="inline-block px-6 py-2 bg-cyan-600 text-white rounded-lg font-semibold hover:bg-cyan-700 transition">
                    Browse Tasks →
                  </span>
                </div>
              )}

              {(profile?.user_type === 'tasker' || profile?.user_type === 'both') && (
                <div 
                  onClick={() => router.push('/my-applications')}
                  className="p-6 border-2 border-amber-200 rounded-xl hover:border-amber-400 transition cursor-pointer"
                >
                  <h3 className="text-xl font-bold text-gray-900 mb-2">📋 My Applications</h3>
                  <p className="text-gray-600 mb-4">
                    Track your task applications and see which ones you've been hired for.
                  </p>
                  <span className="inline-block px-6 py-2 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700 transition">
                    View Applications →
                  </span>
                </div>
              )}

              {(profile?.user_type === 'tasker' || profile?.user_type === 'both') && (
                <div 
                  onClick={() => router.push('/setup-profile')}
                  className="p-6 border-2 border-purple-200 rounded-xl hover:border-purple-400 transition cursor-pointer"
                >
                  <h3 className="text-xl font-bold text-gray-900 mb-2">⚙️ Setup Tasker Profile</h3>
                  <p className="text-gray-600 mb-4">
                    {profile?.services_offered?.length > 0 
                      ? 'Update your services, rates, and availability to get more bookings'
                      : 'Complete your profile so clients can find and book you directly'
                    }
                  </p>
                  <span className="inline-block px-6 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition">
                    {profile?.services_offered?.length > 0 ? 'Edit Profile' : 'Setup Profile'} →
                  </span>
                </div>
              )}

            </div>
          </div>

          {/* Featured Tasks Section - Only for Taskers */}
          {(profile?.user_type === 'tasker' || profile?.user_type === 'both') && (
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 mt-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">🔥 Featured Tasks</h2>
                <Link 
                  href="/browse-tasks"
                  className="text-cyan-600 hover:text-cyan-700 font-semibold"
                >
                  View All →
                </Link>
              </div>

              {tasksLoading ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading tasks...</p>
                </div>
              ) : featuredTasks.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-5xl mb-3">📋</div>
                  <p className="text-gray-600">No tasks available right now. Check back soon!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {featuredTasks.map(task => {
                    const applicationCount = task.applications?.[0]?.count || 0
                    
                    return (
                      <div
                        key={task.id}
                        onClick={() => router.push('/browse-tasks')}
                        className="p-5 border-2 border-gray-200 rounded-xl hover:border-cyan-400 hover:shadow-md transition cursor-pointer"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3 flex-1">
                            <span className="text-3xl">{getCategoryIcon(task.category)}</span>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-lg font-bold text-gray-900 line-clamp-1">
                                  {task.title}
                                </h3>
                                {task.is_urgent && (
                                  <span className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
                                    🚀 URGENT
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 line-clamp-1">
                                {task.description}
                              </p>
                            </div>
                          </div>

                          <div className="text-right ml-4">
                            <p className="text-xs text-gray-500">Budget</p>
                            <p className="text-xl font-bold text-cyan-600">
                              Ksh {task.budget.toLocaleString()}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-4 text-gray-600">
                            <span>📍 {task.town}, {task.county}</span>
                            <span>👥 {applicationCount} applicants</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="text-yellow-500 text-xs">⭐</span>
                            <span className="text-xs text-gray-600">
                              {task.client?.rating?.toFixed(1) || 'New'} client
                            </span>
                            <VerifiedBadge isVerified={task.client?.is_verified} size="sm" />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Success/Info Message */}
          {isNewAccount() ? (
            <div className="mt-8 text-center p-6 bg-green-50 border border-green-200 rounded-xl">
              <p className="text-lg text-green-800">
                <span className="font-bold">Congratulations!</span> You're now part of Kenya's 0% commission task marketplace! 🇰🇪
              </p>
            </div>
          ) : (
            <div className="mt-8 text-center p-6 bg-blue-50 border border-blue-200 rounded-xl">
              <p className="text-lg text-blue-800">
                💡 <span className="font-bold">Tip:</span> {profile?.user_type === 'client' ? 'Post detailed task descriptions to get better applications' : profile?.user_type === 'tasker' ? 'Complete your profile to get more bookings' : 'You can both post tasks and apply to tasks!'}
              </p>
            </div>
          )}

        </div>
      </div>

      {/* PWA Install Prompt */}
      <PWAInstallPrompt />
    </div>
  )
}
