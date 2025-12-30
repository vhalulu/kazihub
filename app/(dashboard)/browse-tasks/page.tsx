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
      const appCount = task.applications?.[0]?.count || 0
      if (maxApplications === 'low' && appCount > 3) return false
      if (maxApplications === 'medium' && appCount > 10) return false
    }

    // Client Rating filter
    if (minClientRating !== 'all') {
      const clientRating = task.client?.rating || 0
      const minRating = Number(minClientRating)
      if (clientRating < minRating) return false
    }

    return true
  })

  if (!userProfile) {
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
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-lg"></div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              KaziHub
            </span>
          </Link>
          <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 font-medium">
            ← Back to Dashboard
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-7xl mx-auto">
          
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Browse Tasks</h1>
            <p className="text-gray-600">Find tasks in your area and start earning today</p>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
            {/* Search */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Search Tasks
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title, description, or location..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
              />
            </div>

            {/* Category and County Filters */}
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
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
                  County
                </label>
                <select
                  value={selectedCounty}
                  onChange={(e) => setSelectedCounty(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
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
            <div className="border-t border-gray-200 pt-6 mt-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">🎯 Advanced Filters</h3>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Date Posted */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    📅 Date Posted
                  </label>
                  <select
                    value={datePosted}
                    onChange={(e) => setDatePosted(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
                  >
                    <option value="all">All Time</option>
                    <option value="today">Last 24 Hours</option>
                    <option value="week">Last Week</option>
                    <option value="month">Last Month</option>
                  </select>
                </div>

                {/* Budget Range */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    💰 Min Budget (KES)
                  </label>
                  <input
                    type="number"
                    value={budgetMin}
                    onChange={(e) => setBudgetMin(e.target.value)}
                    placeholder="e.g. 1000"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    💰 Max Budget (KES)
                  </label>
                  <input
                    type="number"
                    value={budgetMax}
                    onChange={(e) => setBudgetMax(e.target.value)}
                    placeholder="e.g. 10000"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
                  />
                </div>

                {/* Application Competition */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    🔢 Competition Level
                  </label>
                  <select
                    value={maxApplications}
                    onChange={(e) => setMaxApplications(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
                  >
                    <option value="all">All Tasks</option>
                    <option value="low">Low (≤3 applicants)</option>
                    <option value="medium">Medium (≤10 applicants)</option>
                  </select>
                </div>

                {/* Client Rating */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    ⭐ Min Client Rating
                  </label>
                  <select
                    value={minClientRating}
                    onChange={(e) => setMinClientRating(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
                  >
                    <option value="all">All Clients</option>
                    <option value="3">3+ Stars</option>
                    <option value="4">4+ Stars</option>
                    <option value="4.5">4.5+ Stars</option>
                  </select>
                </div>

                {/* Clear Filters Button */}
                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setDatePosted('all')
                      setBudgetMin('')
                      setBudgetMax('')
                      setMaxApplications('all')
                      setMinClientRating('all')
                    }}
                    className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition"
                  >
                    🔄 Clear Advanced Filters
                  </button>
                </div>
              </div>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Sort by:
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'newest', label: 'Newest' },
                  { value: 'budget_high', label: 'Highest Budget' },
                  { value: 'budget_low', label: 'Lowest Budget' },
                  { value: 'urgent', label: 'Urgent First' },
                ].map(option => (
                  <button
                    key={option.value}
                    onClick={() => setSortBy(option.value)}
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                      sortBy === option.value
                        ? 'bg-cyan-600 text-white'
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
            <p className="text-gray-600">
              {loading ? 'Loading...' : `${filteredTasks.length} ${filteredTasks.length === 1 ? 'task' : 'tasks'} available`}
            </p>
          </div>

          {/* Task Cards */}
          {loading ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 border-4 border-cyan-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading tasks...</p>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-gray-100">
              <div className="text-6xl mb-4">🔍</div>
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
                    className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition border border-gray-100 overflow-hidden"
                  >
                    {/* Card Header */}
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{getCategoryIcon(task.category)}</span>
                          <span className="text-xs font-semibold text-gray-500 uppercase">
                            {getCategoryLabel(task.category)}
                          </span>
                        </div>
                        {task.is_urgent && (
                          <span className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
                            🚀 URGENT
                          </span>
                        )}
                      </div>

                      <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                        {task.title}
                      </h3>

                      <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                        {task.description}
                      </p>

                      {/* Location */}
                      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                        <span>📍</span>
                        <span>{task.town}, {task.county}</span>
                      </div>

                      {/* Budget */}
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="text-xs text-gray-500">Budget</p>
                          <p className="text-2xl font-bold text-cyan-600">
                            Ksh {task.budget.toLocaleString()}
                          </p>
                        </div>
                        {task.has_insurance && (
                          <div className="text-center">
                            <span className="text-2xl">🔒</span>
                            <p className="text-xs text-gray-500">Insured</p>
                          </div>
                        )}
                      </div>

                      {/* Client Info */}
                      <div className="flex items-center gap-2 pb-4 border-b border-gray-200">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
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
                      <div className="pt-4">
                        {maxApplications && (
                          <p className="text-xs text-gray-500 mb-2">
                            👥 {applicationCount} / {maxApplications} applications
                            {isFull && <span className="ml-1 text-amber-600 font-semibold">- FULL</span>}
                          </p>
                        )}

                        {hasApplied ? (
                          <button
                            disabled
                            className="w-full py-3 bg-gray-400 text-white rounded-lg font-semibold cursor-not-allowed"
                          >
                            ✓ Already Applied
                          </button>
                        ) : isFull ? (
                          <button
                            disabled
                            className="w-full py-3 bg-gray-400 text-white rounded-lg font-semibold cursor-not-allowed"
                          >
                            🔒 FULL
                          </button>
                        ) : (
                          <button
                            onClick={() => handleApplyClick(task)}
                            className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-cyan-500/30 transition"
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

            {/* Load More / Show All Buttons */}
            {displayCount < filteredTasks.length && (
              <div className="text-center mt-8">
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={() => setDisplayCount(prev => prev + 10)}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-semibold hover:shadow-lg transition"
                  >
                    Load 10 More ({filteredTasks.length - displayCount} remaining)
                  </button>
                  <button
                    onClick={() => setDisplayCount(filteredTasks.length)}
                    className="px-6 py-3 border-2 border-blue-600 text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition"
                  >
                    Show All {filteredTasks.length} Tasks
                  </button>
                </div>
              </div>
            )}
          </>
          )}

        </div>
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
