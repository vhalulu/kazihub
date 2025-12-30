'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import Image from 'next/image'
import VerifiedBadge from '@/components/VerifiedBadge'
import { TASK_CATEGORIES, getCategoryIcon, getCategoryLabel } from '@/lib/task-categories'

export default function BrowseTaskersPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [profile, setProfile] = useState<any>(null)
  const [taskers, setTaskers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    service: '',
    county: '',
    minRating: 0,
    verifiedOnly: false,
  })

  useEffect(() => {
    loadProfile()
    loadTaskers()
  }, [])

  useEffect(() => {
    loadTaskers()
  }, [filters])

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
    }
  }

  const loadTaskers = async () => {
    try {
      let query = supabase
        .from('profiles')
        .select('*')
        .in('user_type', ['tasker', 'both'])
        .eq('is_available', true)
        .not('services_offered', 'is', null)

      if (filters.service) {
        query = query.contains('services_offered', [filters.service])
      }

      if (filters.county) {
        query = query.eq('county', filters.county)
      }

      if (filters.minRating > 0) {
        query = query.gte('rating', filters.minRating)
      }

      if (filters.verifiedOnly) {
        query = query.eq('is_verified', true)
      }

      query = query.order('rating', { ascending: false })

      const { data, error } = await query

      if (error) throw error

      setTaskers(data || [])
    } catch (error) {
      console.error('Error loading taskers:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50/30 to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading taskers...</p>
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
          <Link 
            href="/dashboard"
            className="text-gray-600 hover:text-gray-900 font-medium"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-7xl mx-auto">
          
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Browse Taskers</h1>
            <p className="text-gray-600">Find and book verified professionals directly</p>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Filter Taskers</h2>
            <div className="grid md:grid-cols-4 gap-4">
              
              {/* Service Filter */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Service
                </label>
                <select
                  value={filters.service}
                  onChange={(e) => setFilters({ ...filters, service: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="">All Services</option>
                  {TASK_CATEGORIES.map(category => (
                    <option key={category.value} value={category.value}>
                      {category.icon} {category.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* County Filter */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  County
                </label>
                <select
                  value={filters.county}
                  onChange={(e) => setFilters({ ...filters, county: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="">All Counties</option>
                  <option value="Nairobi">Nairobi</option>
                  <option value="Mombasa">Mombasa</option>
                  <option value="Kisumu">Kisumu</option>
                  <option value="Nakuru">Nakuru</option>
                  <option value="Eldoret">Eldoret</option>
                </select>
              </div>

              {/* Rating Filter */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Minimum Rating
                </label>
                <select
                  value={filters.minRating}
                  onChange={(e) => setFilters({ ...filters, minRating: Number(e.target.value) })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="0">Any Rating</option>
                  <option value="3">3+ Stars</option>
                  <option value="4">4+ Stars</option>
                  <option value="4.5">4.5+ Stars</option>
                </select>
              </div>

              {/* Verified Filter */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Verification
                </label>
                <div className="flex items-center h-[50px]">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.verifiedOnly}
                      onChange={(e) => setFilters({ ...filters, verifiedOnly: e.target.checked })}
                      className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <span className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                      <span>✅</span> Verified Only
                    </span>
                  </label>
                </div>
              </div>

            </div>
          </div>

          {/* Taskers Grid */}
          {taskers.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-gray-100">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No taskers found</h3>
              <p className="text-gray-600">Try adjusting your filters to see more results</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {taskers.map(tasker => (
                <div
                  key={tasker.id}
                  className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition border border-gray-100 overflow-hidden cursor-pointer"
                  onClick={() => router.push(`/tasker/${tasker.id}`)}
                >
                  {/* Profile Photo */}
                  <div className="h-48 bg-gradient-to-br from-blue-500 to-cyan-500 relative">
                    {tasker.profile_photo_url ? (
                      <Image
                        src={tasker.profile_photo_url}
                        alt={tasker.full_name}
                        fill
                        className="object-cover"
                        style={{ objectPosition: 'center 30%' }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-6xl font-bold text-white">
                          {tasker.full_name?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Tasker Info */}
                  <div className="p-6">
                    {/* Name and Verified Badge */}
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{tasker.full_name}</h3>
                      <VerifiedBadge isVerified={tasker.is_verified} size="md" />
                    </div>

                    {/* Location */}
                    <p className="text-sm text-gray-600 mb-3">
                      📍 {tasker.town}, {tasker.county}
                    </p>

                    {/* Rating */}
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className={i < Math.floor(Number(tasker.rating)) ? 'text-yellow-400' : 'text-gray-300'}>
                            ⭐
                          </span>
                        ))}
                      </div>
                      <span className="text-sm font-semibold text-gray-700">
                        {Number(tasker.rating).toFixed(1)}
                      </span>
                      <span className="text-sm text-gray-500">
                        ({tasker.total_tasks_completed} tasks)
                      </span>
                    </div>

                    {/* Services */}
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-gray-600 mb-2">SERVICES:</p>
                      <div className="flex flex-wrap gap-1">
                        {tasker.services_offered?.slice(0, 3).map((service: string) => {
                          const category = TASK_CATEGORIES.find(c => c.value === service)
                          return (
                            <span key={service} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                              {category?.icon} {category?.label}
                            </span>
                          )
                        })}
                        {tasker.services_offered?.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                            +{tasker.services_offered.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Rates */}
                    <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                      <div>
                        <p className="text-xs text-gray-600">Hourly Rate</p>
                        <p className="text-lg font-bold text-blue-600">KES {tasker.hourly_rate}</p>
                      </div>
                      {tasker.daily_rate && (
                        <div className="text-right">
                          <p className="text-xs text-gray-600">Daily Rate</p>
                          <p className="text-lg font-bold text-cyan-600">KES {tasker.daily_rate}</p>
                        </div>
                      )}
                    </div>

                    {/* View Profile Button */}
                    <button className="w-full mt-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg font-semibold hover:shadow-lg transition">
                      View Profile →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
