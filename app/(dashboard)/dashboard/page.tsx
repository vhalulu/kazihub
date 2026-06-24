'use client'
import VerifiedBadge from '@/components/VerifiedBadge'
import NotificationBell from '@/components/NotificationBell'
import PWAInstallBanner, { PWAInstallButton } from '@/components/PWAInstallBanner'
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
  const [featuredTaskers, setFeaturedTaskers] = useState<any[]>([])
  const [tasks, setTasks] = useState<any[]>([])
  const [applications, setApplications] = useState<any[]>([])
  const [showPhoneNumber, setShowPhoneNumber] = useState(false)
  const [activeMode, setActiveMode] = useState<'client' | 'tasker'>('client')

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
          loadTaskerApplications(profileData.id)
        }

        if (profileData.user_type === 'client' || profileData.user_type === 'both') {
          loadFeaturedTaskers(profileData.county)
          loadClientTasks(profileData.id)
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
      console.log('🔥 Loading featured tasks for county:', userCounty)
      
      const { data: tasks, error } = await supabase
        .from('tasks')
        .select(`
          *,
          client:profiles!tasks_client_id_fkey(full_name, rating, total_reviews)
        `)
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(20)

      console.log('📋 Tasks query result:', { 
        tasks, 
        error, 
        count: tasks?.length,
        rawTasks: tasks 
      })

      if (error) {
        console.error('❌ Error fetching tasks:', error)
        return
      }

      if (tasks && tasks.length > 0) {
        const availableTasks = tasks.filter(task => {
          if (!task.max_applications) return true
          return (task.applications || 0) < task.max_applications
        })

        console.log('✅ Available tasks after filtering:', availableTasks.length)

        const scoredTasks = availableTasks.map(task => {
          let score = 0
          if (task.county === userCounty) score += 100
          if (task.is_urgent) score += 80
          if (task.budget) score += Math.min(task.budget / 100, 50)
          const daysOld = Math.floor((Date.now() - new Date(task.created_at).getTime()) / (1000 * 60 * 60 * 24))
          score += Math.max(0, 20 - daysOld)
          return { ...task, score }
        })
        
        const featured = scoredTasks.sort((a, b) => b.score - a.score).slice(0, 6)
        console.log('🌟 Featured tasks selected:', featured.length)
        setFeaturedTasks(featured)
      } else {
        console.log('⚠️ No tasks found in database')
        setFeaturedTasks([])
      }
    } catch (error) {
      console.error('❌ Error loading featured tasks:', error)
    }
  }

  const loadTaskerApplications = async (taskerId: string) => {
    try {
      const { data } = await supabase
        .from('task_applications')
        .select('id, status, created_at')
        .eq('tasker_id', taskerId)
        .order('created_at', { ascending: false })

      if (data) {
        setApplications(data)
      }
    } catch (error) {
      console.error('Error loading applications:', error)
    }
  }

  const loadFeaturedTaskers = async (userCounty: string) => {
    try {
      console.log('Loading featured taskers for county:', userCounty)
      
      const { data: taskers, error } = await supabase
        .from('profiles')
        .select('*')
        .in('user_type', ['tasker', 'both'])
        .limit(50)

      console.log('Taskers query result:', { count: taskers?.length, error })

      if (error) {
        console.error('Error fetching taskers:', error)
        return
      }

      if (taskers && taskers.length > 0) {
        const scoredTaskers = taskers.map(tasker => {
          let score = 0
          if (tasker.is_verified) score += 50
          if (tasker.is_available) score += 40
          if (tasker.profile_photo_url) score += 30
          if (tasker.rating && tasker.rating > 0) score += tasker.rating * 20
          if (tasker.county === userCounty) score += 25
          if (tasker.hourly_rate) score += 20
          if (tasker.jobs_completed) score += Math.min(tasker.jobs_completed, 15)
          return { ...tasker, score }
        })
        
        const featured = scoredTaskers.sort((a, b) => b.score - a.score).slice(0, 6)
        setFeaturedTaskers(featured)
      }
    } catch (error) {
      console.error('Error loading featured taskers:', error)
    }
  }

  const loadClientTasks = async (clientId: string) => {
    try {
      const { data } = await supabase
        .from('tasks')
        .select('id, status')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })

      if (data) {
        setTasks(data)
      }
    } catch (error) {
      console.error('Error loading client tasks:', error)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-navy-800 mx-auto mb-4"></div>
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
    <div className="min-h-screen bg-gray-50">
      
      {/* Professional Navigation - Navy Blue */}
      <div className="bg-[#2c3e50] border-b border-[#1a252f] sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/dashboard" className="flex items-center gap-3 group">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">K</span>
              </div>
              <span className="text-xl font-bold text-white">KaziHub</span>
            </Link>

            <div className="flex items-center gap-6">
              <div className="hidden sm:flex items-center gap-2">
                <button
                  onClick={() => setShowPhoneNumber(!showPhoneNumber)}
                  className="text-sm text-gray-300 hover:text-white transition flex items-center gap-2 px-3 py-2 rounded-md hover:bg-[#34495e]"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  {showPhoneNumber ? (
                    <span className="font-mono text-white">{profile.phone_number}</span>
                  ) : (
                    <span>Phone</span>
                  )}
                </button>
              </div>

              {/* Messages Icon */}
              <Link 
                href="/messages"
                className="relative p-2 text-gray-300 hover:text-white hover:bg-[#34495e] rounded-md transition"
                title="Messages"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </Link>

              <div className="[&_svg]:stroke-white [&_div]:text-white">
                <NotificationBell userId={profile.id} />
              </div>

              <div className="hidden md:block text-sm">
                <span className="text-gray-300">Welcome, </span>
                <span className="font-semibold text-white">{profile.full_name?.split(' ')[0]}</span>
              </div>

              {/* PWA Install Button */}
              <PWAInstallButton />

              <button
                onClick={handleSignOut}
                className="text-sm text-gray-300 hover:text-white transition font-medium px-3 py-2 rounded-md hover:bg-[#34495e] flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Mode Toggle Tabs (for 'both' users only) */}
        {profile.user_type === 'both' && (
          <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-2 inline-flex">
            <button
              onClick={() => setActiveMode('client')}
              className={`px-6 py-3 rounded-md font-semibold transition-all ${
                activeMode === 'client'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Client Mode
              </span>
            </button>
            <button
              onClick={() => setActiveMode('tasker')}
              className={`px-6 py-3 rounded-md font-semibold transition-all ${
                activeMode === 'tasker'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Tasker Mode
              </span>
            </button>
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Left Column - Profile Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              
              <div className="flex flex-col items-center mb-6">
                <ProfilePhotoUpload 
                  userId={profile.id}
                  currentPhotoUrl={profile.profile_photo_url}
                  onUploadSuccess={(url) => setProfile({...profile, profile_photo_url: url})}
                />
                
                <h2 className="text-xl font-bold text-gray-900 mt-4 mb-1">
                  {profile.full_name}
                </h2>
                
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-md text-sm font-semibold">
                    {userTypeDisplay}
                  </span>
                  {profile.is_verified ? (<div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-md text-xs font-semibold"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>Verified</div>) : profile.verification_status === 'pending' ? (<div className="flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 rounded-md text-xs font-semibold"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> Pending verification</div>) : (<Link href="/verify-identity" className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-semibold hover:bg-blue-200 transition"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>Verify identity</Link>)}
                </div>

                <div className="flex items-center gap-1 text-gray-600 text-sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{profile.town}, {profile.county}</span>
                </div>
              </div>

              {profile.user_type === 'tasker' || profile.user_type === 'both' ? (
                <div className="border-t border-gray-200 pt-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Rating</span>
                    <span className="font-semibold text-gray-900">
                      ⭐ {profile.rating ? profile.rating.toFixed(1) : 'N/A'} ({profile.review_count || 0} reviews)
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Jobs Completed</span>
                    <span className="font-semibold text-gray-900">{profile.jobs_completed || 0}</span>
                  </div>
                  {profile.is_available && (
                    <div className="mt-3 px-3 py-2 bg-success-50 border border-success-200 rounded-md text-center">
                      <span className="text-sm font-semibold text-success-700">✓ Available for Work</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="border-t border-gray-200 pt-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Tasks Posted</span>
                    <span className="font-semibold text-gray-900">{profile.tasks_posted || 0}</span>
                  </div>
                </div>
              )}

              <div className="mt-6 space-y-3">
                <Link
                  href="/edit-profile"
                  className="block w-full text-center px-4 py-2 border border-gray-300 rounded-md text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition"
                >
                  Edit Profile
                </Link>
                
                {(profile.user_type === 'tasker' || profile.user_type === 'both') && (
                  <Link
                    href="/setup-profile"
                    className="block w-full text-center px-4 py-3 bg-[#3B82F6] text-white rounded-md text-sm font-bold hover:bg-[#2563EB] transition shadow-sm"
                  >
                    <span className="text-white">Setup Tasker Profile</span>
                  </Link>
                )}

                {(profile.user_type === 'tasker' || profile.user_type === 'both') && (
                  <Link
                    href="/edit-profile#subscription"
                    className="block w-full text-center px-4 py-3 bg-[#3B82F6] text-white rounded-md text-sm font-bold hover:bg-[#2563EB] transition shadow-sm"
                  >
                    {profile.is_pro_tasker ? '⭐ Manage Subscription' : '⭐ Subscribe to Pro'}
                  </Link>
                )}
              </div>

              {profile.is_admin && (
                <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-md">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-purple-600 rounded-md flex items-center justify-center text-white font-bold">
                      A
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 text-sm mb-1">Admin: ID Verifications</h4>
                      <p className="text-xs text-gray-600 mb-3">Review and approve user identity verification documents</p>
                      <Link
                        href="/admin/verifications"
                        className="inline-block px-4 py-2 bg-purple-600 text-white text-sm rounded-md font-semibold hover:bg-purple-700 transition"
                      >
                        Review Verifications →
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Center Column - Featured Taskers (FOR CLIENTS) */}
          {((profile.user_type === 'client') || (profile.user_type === 'both' && activeMode === 'client')) ? (
            <div className="lg:col-span-2">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">🌟 Featured Taskers</h2>
                <p className="text-gray-600">Top-rated professionals ready to help</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {featuredTaskers.length === 0 ? (
                  <div className="col-span-2 bg-white rounded-lg shadow-sm p-12 text-center border border-gray-200">
                    <div className="text-6xl mb-4">👨‍🔧</div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">No Featured Taskers Yet</h3>
                    <p className="text-gray-600 mb-4">Be the first to discover talented professionals in your area!</p>
                    <Link href="/browse-taskers" className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition">
                      Browse All Taskers
                    </Link>
                  </div>
                ) : (
                  featuredTaskers.slice(0, 6).map((tasker: any) => (
                  <Link
                    key={tasker.id}
                    href={`/tasker/${tasker.id}`}
                    className="group bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-200"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        {tasker.profile_photo_url ? (
                          <img src={tasker.profile_photo_url} alt={tasker.full_name} className="w-16 h-16 rounded-full object-cover border-2 border-gray-200" />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xl font-bold">
                            {tasker.full_name?.charAt(0) || 'T'}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition truncate">{tasker.full_name}</h3>
                          {tasker.is_verified && (
                            <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
                          <span className="truncate">{tasker.town}, {tasker.county}</span>
                        </div>
                        {tasker.services_offered && tasker.services_offered.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {tasker.services_offered.slice(0, 3).map((service: string) => (
                              <span key={service} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded">
                                {service.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </span>
                            ))}
                            {tasker.services_offered.length > 3 && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded">+{tasker.services_offered.length - 3} more</span>
                            )}
                          </div>
                        )}
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-1">
                            <span className="text-yellow-500">⭐</span>
                            <span className="font-semibold text-gray-900">{tasker.rating || 'New'}</span>
                            {tasker.jobs_completed > 0 && <span className="text-gray-500">({tasker.jobs_completed} jobs)</span>}
                          </div>
                          <div className="text-blue-600 font-semibold">
                            {tasker.hourly_rate ? `Ksh ${tasker.hourly_rate.toLocaleString()}/hr` : <span className="text-gray-500 text-xs">Rate TBD</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                  ))
                )}
              </div>

              <Link href="/browse-taskers" className="block w-full py-4 bg-gray-700 text-white rounded-lg font-bold text-center hover:bg-gray-800 transition shadow-sm">
                Browse More Taskers →
              </Link>
            </div>
          ) : (
            <div className="lg:col-span-2">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">🔥 Featured Tasks</h2>
                <p className="text-gray-600">Top opportunities matching your location</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {featuredTasks.length === 0 ? (
                  <div className="col-span-2 bg-white rounded-lg shadow-sm p-12 text-center border border-gray-200">
                    <div className="text-6xl mb-4">📋</div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">No Tasks Available</h3>
                    <p className="text-gray-600 mb-4">Check back soon for new opportunities!</p>
                    <Link href="/browse-tasks" className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition">Browse All Tasks</Link>
                  </div>
                ) : (
                  featuredTasks.map((task: any) => (
                  <Link key={task.id} href={`/browse-tasks`} className="group bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-200">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center text-2xl">
                          {getCategoryIcon(task.category)}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition line-clamp-1">{task.title}</h3>
                          {task.is_urgent && <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full flex-shrink-0">URGENT</span>}
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2 mb-3">{task.description}</p>
                        <div className="flex items-center gap-3 text-sm mb-2">
                          <div className="flex items-center gap-1 text-gray-600">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
                            <span className="truncate">{task.town}, {task.county}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-1">
                            <span className="text-gray-500">Posted by:</span>
                            <span className="font-semibold text-gray-900">{task.client?.full_name}</span>
                          </div>
                          <div className="text-green-600 font-bold text-lg">Ksh {task.budget?.toLocaleString()}</div>
                        </div>
                      </div>
                    </div>
                  </Link>
                  ))
                )}
              </div>

              <Link href="/browse-tasks" className="block w-full py-4 bg-gray-700 text-white rounded-lg font-bold text-center hover:bg-gray-800 transition shadow-sm">
                Browse More Tasks →
              </Link>
            </div>
          )}

          {/* Right Column - My Tasks Widget (FOR CLIENTS ONLY) */}
          {((profile.user_type === 'client') || (profile.user_type === 'both' && activeMode === 'client')) && (
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 sticky top-24">
                <div className="flex items-center gap-2 mb-4">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                  <h3 className="text-lg font-bold text-gray-900">My Tasks</h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">Manage your tasks and review applications</p>
                <Link href="/my-tasks" className="block w-full py-3 bg-gray-700 text-white rounded-lg font-semibold text-center hover:bg-gray-800 transition mb-3">
                  View All Tasks →
                </Link>
                <div className="border-t border-gray-200 pt-4">
                  <div className="text-sm text-gray-600">
                    <div className="flex justify-between items-center mb-2">
                      <span>Active Tasks</span>
                      <span className="font-bold text-gray-900">{tasks.filter((t: any) => t.status === 'open').length || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Completed</span>
                      <span className="font-bold text-gray-900">{tasks.filter((t: any) => t.status === 'completed').length || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Right Column - My Applications Widget (FOR TASKERS ONLY) */}
          {((profile.user_type === 'tasker') || (profile.user_type === 'both' && activeMode === 'tasker')) && (
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 sticky top-24">
                <div className="flex items-center gap-2 mb-4">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <h3 className="text-lg font-bold text-gray-900">My Applications</h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">Track your task applications</p>
                <Link href="/my-applications" className="block w-full py-3 bg-gray-700 text-white rounded-lg font-semibold text-center hover:bg-gray-800 transition mb-3">
                  View All Applications →
                </Link>
                <div className="border-t border-gray-200 pt-4">
                  <div className="text-sm text-gray-600">
                    <div className="flex justify-between items-center mb-2">
                      <span>Pending</span>
                      <span className="font-bold text-yellow-600">{applications.filter((a: any) => a.status === 'pending').length || 0}</span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span>Accepted</span>
                      <span className="font-bold text-green-600">{applications.filter((a: any) => a.status === 'accepted').length || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Rejected</span>
                      <span className="font-bold text-red-600">{applications.filter((a: any) => a.status === 'rejected').length || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* PWA Install Banner */}
      <PWAInstallBanner />
    </div>
  )
}
