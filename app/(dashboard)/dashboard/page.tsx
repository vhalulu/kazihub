'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import DashboardNav from '@/components/DashboardNav'
import ProfilePhotoUpload from '@/components/ProfilePhotoUpload'
import VerifiedBadge from '@/components/VerifiedBadge'
import PWAInstallBanner from '@/components/PWAInstallBanner'
import { getCategoryIcon } from '@/lib/task-categories'

import { ProfileSkeleton, StatsSkeleton, TaskCardSkeleton } from '@/components/SkeletonLoaders'

export default function HomePage() {
  const router = useRouter()
  const supabase = createClient()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [featuredTasks, setFeaturedTasks] = useState<any[]>([])
  const [stats, setStats] = useState({
    activeTasks: 0,
    completedTasks: 0,
    totalEarnings: 0,
  })

  // Prefetch routes
  useEffect(() => {
    router.prefetch('/post-task')
    router.prefetch('/my-tasks')
    router.prefetch('/browse-tasks')
    router.prefetch('/my-applications')
    router.prefetch('/messages')
    router.prefetch('/edit-profile')
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

        // Load stats and featured tasks
        loadFeaturedTasks(profileData.county)
        
        if (profileData.user_type === 'tasker' || profileData.user_type === 'both') {
          loadTaskerStats(profileData.id)
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

  const loadTaskerStats = async (userId: string) => {
    try {
      const { data: applications } = await supabase
        .from('task_applications')
        .select('status, proposed_price, task:tasks(status)')
        .eq('tasker_id', userId)

      if (applications) {
        const active = applications.filter(app => 
          app.status === 'accepted' && (app.task as any)?.status === 'in_progress'
        ).length

        const completed = applications.filter(app => 
          app.status === 'accepted' && (app.task as any)?.status === 'completed'
        ).length

        const earnings = applications
          .filter(app => app.status === 'accepted' && (app.task as any)?.status === 'completed')
          .reduce((sum, app) => sum + (app.proposed_price || 0), 0)

        setStats({ activeTasks: active, completedTasks: completed, totalEarnings: earnings })
      }
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white border-b border-gray-200 h-14 md:h-16"></nav>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <ProfileSkeleton />
          <div className="mt-6">
            <StatsSkeleton />
          </div>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <TaskCardSkeleton />
            <TaskCardSkeleton />
            <TaskCardSkeleton />
            <TaskCardSkeleton />
          </div>
        </div>
      </div>
    )
  }

  if (!profile) return null

  const isClient = profile.user_type === 'client' || profile.user_type === 'both'
  const isTasker = profile.user_type === 'tasker' || profile.user_type === 'both'

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      <DashboardNav profile={profile} onSignOut={handleSignOut} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Welcome Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-shrink-0">
              <ProfilePhotoUpload 
                userId={profile.id}
                currentPhotoUrl={profile.profile_photo_url}
                onUploadSuccess={(url) => setProfile({...profile, profile_photo_url: url})}
              />
            </div>
            
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                Welcome back, {profile.full_name?.split(' ')[0]}!
                {profile.is_verified && <VerifiedBadge isVerified={profile.is_verified} size="sm" />}
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {profile.user_type === 'both' ? 'Client & Tasker' : profile.user_type === 'client' ? 'Client' : 'Tasker'} • {profile.town}, {profile.county}
              </p>
              {profile.rating && (
                <p className="text-sm text-gray-600 mt-1">
                  ⭐ {profile.rating.toFixed(1)} ({profile.review_count || 0} reviews)
                </p>
              )}
            </div>

            {!profile.is_verified && profile.verification_status !== 'pending' && (
              <Link
                href="/verify-identity"
                className="px-4 py-2 bg-cyan-600 text-white text-sm font-medium rounded-lg hover:bg-cyan-700 transition"
              >
                Get Verified
              </Link>
            )}
          </div>
        </div>

        {/* Stats for Taskers */}
        {isTasker && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="text-sm text-gray-600 mb-1">Active Tasks</div>
              <div className="text-2xl font-bold text-gray-900">{stats.activeTasks}</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="text-sm text-gray-600 mb-1">Completed</div>
              <div className="text-2xl font-bold text-gray-900">{stats.completedTasks}</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="text-sm text-gray-600 mb-1">Total Earnings</div>
              <div className="text-2xl font-bold text-gray-900">Ksh {stats.totalEarnings.toLocaleString()}</div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {isClient && (
            <Link
              href="/post-task"
              className="bg-white border-2 border-gray-200 hover:border-cyan-600 rounded-lg p-6 transition group"
            >
              <div className="text-3xl mb-3">📋</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-cyan-700">Post a Task</h3>
              <p className="text-sm text-gray-600">Describe what you need done and get quotes from taskers</p>
            </Link>
          )}

          {isClient && (
            <Link
              href="/my-tasks"
              className="bg-white border-2 border-gray-200 hover:border-cyan-600 rounded-lg p-6 transition group"
            >
              <div className="text-3xl mb-3">📝</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-cyan-700">My Tasks</h3>
              <p className="text-sm text-gray-600">View and manage your posted tasks and applications</p>
            </Link>
          )}

          {isTasker && (
            <Link
              href="/my-applications"
              className="bg-white border-2 border-gray-200 hover:border-cyan-600 rounded-lg p-6 transition group"
            >
              <div className="text-3xl mb-3">📬</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-cyan-700">My Applications</h3>
              <p className="text-sm text-gray-600">Track your submitted applications and responses</p>
            </Link>
          )}
        </div>

        {/* Featured Tasks - Simple inline list */}
        {featuredTasks.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Featured Tasks</h2>
            </div>

            <div className="space-y-3">
              {featuredTasks.map((task) => (
                <Link
                  key={task.id}
                  href={`/browse-tasks`}
                  className="block bg-white border border-gray-200 rounded-lg p-4 hover:border-cyan-300 hover:shadow-sm transition"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl flex-shrink-0">{getCategoryIcon(task.category)}</span>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 mb-1">{task.title}</h3>
                      <p className="text-sm text-gray-600 line-clamp-2 mb-2">{task.description}</p>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                        <span>📍 {task.town}, {task.county}</span>
                        <span>💰 Ksh {task.budget.toLocaleString()}</span>
                        {task.is_urgent && (
                          <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full font-medium">
                            URGENT
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* View More Link */}
            <div className="mt-4 text-center">
              <Link
                href="/browse-tasks"
                className="inline-block px-6 py-3 bg-white border-2 border-gray-200 text-gray-700 font-medium rounded-lg hover:border-cyan-600 hover:text-cyan-700 transition"
              >
                View More Tasks →
              </Link>
            </div>
          </div>
        )}

        {/* Admin Panel */}
        {profile.is_admin && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Admin Panel</h2>
            <Link
              href="/admin/verifications"
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition"
            >
              <span>👮</span>
              Review ID Verifications
            </Link>
          </div>
        )}
      </div>

      <PWAInstallBanner />
    </div>
  )
}
