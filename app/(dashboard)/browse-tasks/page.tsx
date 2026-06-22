'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { COUNTIES } from '@/lib/kenya-locations'
import ApplyModal from './components/ApplyModal'
import VerifiedBadge from '@/components/VerifiedBadge'
import { TASK_CATEGORIES, getCategoryIcon, getCategoryLabel } from '@/lib/task-categories'

// Add "All Categories" option for filter
const CATEGORIES = [
  { value: 'all', label: 'All Categories', icon: '📋' },
  ...TASK_CATEGORIES
]

export default function BrowseTasksPage() {
  const router = useRouter()
  const supabase = createClient()

  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [displayCount, setDisplayCount] = useState(5) // Show 5 initially

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedCounty, setSelectedCounty] = useState('all')
  const [sortBy, setSortBy] = useState('newest') // newest, budget_high, budget_low, urgent
  
  // Advanced Filters
  const [datePosted, setDatePosted] = useState('all') // all, today, week, month
  const [budgetMin, setBudgetMin] = useState('')
  const [budgetMax, setBudgetMax] = useState('')
  const [maxApplications, setMaxApplications] = useState('all') // all, low, medium
  const [minClientRating, setMinClientRating] = useState('all') // all, 3, 4, 4.5

  // Apply Modal
  const [selectedTask, setSelectedTask] = useState<any>(null)
  const [showApplyModal, setShowApplyModal] = useState(false)

  // Track which tasks user has already applied to
  const [appliedTaskIds, setAppliedTaskIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    checkUserAccess()
  }, [])

  useEffect(() => {
    if (userProfile) {
      loadTasks()
      loadUserApplications()
    }
  }, [userProfile, selectedCategory, selectedCounty, sortBy])

  // Reset display count when filters change
  useEffect(() => {
    setDisplayCount(5)
  }, [selectedCategory, selectedCounty, sortBy, searchQuery, datePosted, budgetMin, budgetMax, maxApplications, minClientRating])

  const checkUserAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (!profile) {
        router.push('/dashboard')
        return
      }

      // Only taskers and "both" can browse tasks
      if (profile.user_type !== 'tasker' && profile.user_type !== 'both') {
        router.push('/dashboard')
        return
      }

      setUserProfile(profile)
    } catch (error) {
      console.error('Auth check error:', error)
      router.push('/dashboard')
    }
  }

  const loadUserApplications = async () => {
    if (!userProfile) return

    try {
      const { data, error } = await supabase
        .from('task_applications')
        .select('task_id')
        .eq('tasker_id', userProfile.id)
        .in('status', ['pending', 'accepted']) // Don't count rejected/withdrawn

      if (error) throw error

      const taskIds = new Set(data?.map(app => app.task_id) || [])
      setAppliedTaskIds(taskIds)
    } catch (error) {
      console.error('Error loading applications:', error)
    }
  }

  const loadTasks = async () => {
    try {
      setLoading(true)

      let query = supabase
        .from('tasks')
        .select(`
          *, 
          client:profiles!tasks_client_id_fkey(full_name, phone_number, rating, is_verified),
          applications:task_applications(count)
        `)
        .eq('status', 'open')

      // Apply category filter
      if (selectedCategory && selectedCategory !== 'all') {
        query = query.eq('category', selectedCategory)
      }

      // Apply county filter
      if (selectedCounty && selectedCounty !== 'all') {
        query = query.eq('county', selectedCounty)
      }

      // Apply sorting
      if (sortBy === 'newest') {
        query = query.order('created_at', { ascending: false })
      } else if (sortBy === 'budget_high') {
        query = query.order('budget', { ascending: false })
      } else if (sortBy === 'budget_low') {
        query = query.order('budget', { ascending: true })
      } else if (sortBy === 'urgent') {
        query = query.order('is_urgent', { ascending: false }).order('created_at', { ascending: false })
      }

      const { data, error } = await query

      if (error) {
        console.error('Error loading tasks:', error)
        throw error
      }

      setTasks(data || [])
    } catch (error) {
      console.error('Load tasks error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApplyClick = (task: any) => {
    setSelectedTask(task)
    setShowApplyModal(true)
  }

  const handleApplicationSuccess = () => {
    loadUserApplications()
    setShowApplyModal(false)
  }

  // Client-side filtering for search and advanced filters
  const filteredTasks = tasks.filter(task => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchesSearch = (
        task.title?.toLowerCase().includes(query) ||
        task.description?.toLowerCase().includes(query) ||
        task.town?.toLowerCase().includes(query) ||
        task.county?.toLowerCase().includes(query)
      )
      if (!matchesSearch) return false
    }

    // Date Posted filter
    if (datePosted !== 'all') {
      const taskDate = new Date(task.created_at)
      const now = new Date()
      const diffHours = (now.getTime() - taskDate.getTime()) / (1000 * 60 * 60)
      
      if (datePosted === 'today' && diffHours > 24) return false
      if (datePosted === 'week' && diffHours > 168) return false
      if (datePosted === 'month' && diffHours > 720) return false
    }

    // Budget Range filter
    if (budgetMin && task.budget < Number(budgetMin)) return false
    if (budgetMax && task.budget > Number(budgetMax)) return false

    // Application Count filter
    if (maxApplications !== 'all') {
      const applicationCount = task.applications?.[0]?.count || 0
      if (maxApplications === 'low' && applicationCount > 3) return false
      if (maxApplications === 'medium' && applicationCount > 10) return false
    }

    // Client Rating filter
    if (minClientRating !== 'all') {
      const rating = task.client?.rating || 0
      if (rating < Number(minClientRating)) return false
    }

    return true
  })

  if (!userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* Professional Navigation */}
      <div className="bg-[#2c3e50] border-b border-[#1a252f] sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/dashboard" className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">K</span>
              </div>
              <span className="text-xl font-bold text-white">KaziHub</span>
            </Link>
            <Link href="/dashboard" className="text-sm text-gray-300 hover:text-white transition">
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Browse Available Tasks</h1>
          <p className="text-gray-600">Find tasks in your area and start earning today</p>
        </div>

        {/* Professional Search & Filter Card */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8 border border-gray-200">
          
          {/* Search Bar */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Search Tasks
            </label>
            <div className="relative">
              <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title, description, or location..."
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          {/* Basic Filters */}
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.icon} {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Location
              </label>
              <select
                value={selectedCounty}
                onChange={(e) => setSelectedCounty(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="all">All Counties</option>
                {COUNTIES.map(county => (
                  <option key={county} value={county}>
                    {county}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Advanced Filters */}
          <details className="border-t border-gray-200 pt-6">
            <summary className="cursor-pointer text-sm font-bold text-gray-900 mb-4 hover:text-blue-600 transition">
              Advanced Filters
            </summary>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              {/* Date Posted */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Date Posted
                </label>
                <select
                  value={datePosted}
                  onChange={(e) => setDatePosted(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="all">All Time</option>
                  <option value="today">Last 24 Hours</option>
                  <option value="week">Last Week</option>
                  <option value="month">Last Month</option>
                </select>
              </div>

              {/* Min Budget */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Min Budget (KES)
                </label>
                <input
                  type="number"
                  value={budgetMin}
                  onChange={(e) => setBudgetMin(e.target.value)}
                  placeholder="e.g. 1000"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              {/* Max Budget */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Max Budget (KES)
                </label>
                <input
                  type="number"
                  value={budgetMax}
                  onChange={(e) => setBudgetMax(e.target.value)}
                  placeholder="e.g. 10000"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              {/* Competition Level */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Competition Level
                </label>
                <select
                  value={maxApplications}
                  onChange={(e) => setMaxApplications(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="all">All Tasks</option>
                  <option value="low">Low (≤3 applicants)</option>
                  <option value="medium">Medium (≤10 applicants)</option>
                </select>
              </div>

              {/* Client Rating */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Min Client Rating
                </label>
                <select
                  value={minClientRating}
                  onChange={(e) => setMinClientRating(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="all">All Clients</option>
                  <option value="3">3+ Stars</option>
                  <option value="4">4+ Stars</option>
                  <option value="4.5">4.5+ Stars</option>
                </select>
              </div>

              {/* Clear Filters */}
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setDatePosted('all')
                    setBudgetMin('')
                    setBudgetMax('')
                    setMaxApplications('all')
                    setMinClientRating('all')
                  }}
                  className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </details>

          {/* Sort By */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Sort by
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'newest', label: 'Newest First' },
                { value: 'budget_high', label: 'Highest Budget' },
                { value: 'budget_low', label: 'Lowest Budget' },
                { value: 'urgent', label: 'Urgent First' },
              ].map(option => (
                <button
                  key={option.value}
                  onClick={() => setSortBy(option.value)}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    sortBy === option.value
                      ? 'bg-[#2c3e50] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-600 font-medium">
            {loading ? 'Loading...' : `${filteredTasks.length} ${filteredTasks.length === 1 ? 'task' : 'tasks'} available`}
          </p>
        </div>

        {/* Task Cards */}
        {loading ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading tasks...</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center border border-gray-200">
            <svg className="w-24 h-24 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No tasks found</h3>
            <p className="text-gray-600">Try adjusting your filters or check back later for new tasks</p>
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTasks.slice(0, displayCount).map(task => {
              const applicationCount = task.applications?.[0]?.count || 0
              const maxApplications = task.max_applications
              const isFull = maxApplications && applicationCount >= maxApplications
              const hasApplied = appliedTaskIds.has(task.id)

              return (
                <div
                  key={task.id}
                  className="bg-white rounded-lg shadow-sm hover:shadow-md transition border border-gray-200 overflow-hidden"
                >
                  {/* Card Content */}
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{getCategoryIcon(task.category)}</span>
                        <span className="text-xs font-semibold text-gray-500 uppercase">
                          {getCategoryLabel(task.category)}
                        </span>
                      </div>
                      {task.is_urgent && (
                        <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">
                          URGENT
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                      {task.title}
                    </h3>

                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {task.description}
                    </p>

                    {/* Location */}
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      </svg>
                      <span>{task.town}, {task.county}</span>
                    </div>

                    {/* Budget */}
                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Budget</p>
                        <p className="text-2xl font-bold text-green-600">
                          Ksh {task.budget.toLocaleString()}
                        </p>
                      </div>
                      {task.has_insurance && (
                        <div className="text-center">
                          <svg className="w-6 h-6 text-blue-600 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          <p className="text-xs text-gray-500">Insured</p>
                        </div>
                      )}
                    </div>

                    {/* Client Info */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-bold">
                        {task.client?.full_name?.charAt(0).toUpperCase() || 'C'}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-1">
                          <p className="text-sm font-semibold text-gray-900">
                            {task.client?.full_name || 'Client'}
                          </p>
                          <VerifiedBadge isVerified={task.client?.is_verified} size="sm" />
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-yellow-500 text-xs">⭐</span>
                          <span className="text-xs text-gray-600">
                            {task.client?.rating?.toFixed(1) || 'New'} rating
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Application Status */}
                    <div>
                      {maxApplications && (
                        <p className="text-xs text-gray-500 mb-2">
                          {applicationCount} / {maxApplications} applications
                          {isFull && <span className="ml-1 text-red-600 font-semibold">- FULL</span>}
                        </p>
                      )}

                      {hasApplied ? (
                        <button
                          disabled
                          className="w-full py-3 bg-gray-300 text-gray-600 rounded-lg font-semibold cursor-not-allowed"
                        >
                          ✓ Already Applied
                        </button>
                      ) : isFull ? (
                        <button
                          disabled
                          className="w-full py-3 bg-gray-300 text-gray-600 rounded-lg font-semibold cursor-not-allowed"
                        >
                          Applications Full
                        </button>
                      ) : (
                        <button
                          onClick={() => handleApplyClick(task)}
                          className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
                        >
                          Apply to Task →
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Load More / Show All */}
          {displayCount < filteredTasks.length && (
            <div className="text-center mt-8">
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => setDisplayCount(prev => prev + 10)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
                >
                  Load 10 More ({filteredTasks.length - displayCount} remaining)
                </button>
                <button
                  onClick={() => setDisplayCount(filteredTasks.length)}
                  className="px-6 py-3 border-2 border-blue-600 text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition"
                >
                  Show All {filteredTasks.length}
                </button>
              </div>
            </div>
          )}
        </>
        )}

      </div>

      {/* Apply Modal */}
      {showApplyModal && selectedTask && (
        <ApplyModal
          task={selectedTask}
          isOpen={showApplyModal}
          userProfile={userProfile}
          onClose={() => setShowApplyModal(false)}
          onSuccess={handleApplicationSuccess}
        />
      )}
    </div>
  )
}
