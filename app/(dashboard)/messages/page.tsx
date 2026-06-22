'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function MessagesPage() {
  const router = useRouter()
  const supabase = createClient()

  const [conversations, setConversations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [userProfile, setUserProfile] = useState<any>(null)

  useEffect(() => {
    checkUserAccess()
  }, [])

  useEffect(() => {
    if (userProfile) {
      loadConversations()
    }
  }, [userProfile])

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

      setUserProfile(profile)
    } catch (error) {
      console.error('Auth check error:', error)
      router.push('/dashboard')
    }
  }

  const loadConversations = async () => {
    try {
      setLoading(true)

      // Get conversations where user is either user1 or user2
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          user1:profiles!conversations_user1_id_fkey(
            id,
            full_name,
            profile_photo_url
          ),
          user2:profiles!conversations_user2_id_fkey(
            id,
            full_name,
            profile_photo_url
          ),
          messages(
            id,
            content,
            sender_id,
            is_read,
            created_at
          )
        `)
        .or(`user1_id.eq.${userProfile.id},user2_id.eq.${userProfile.id}`)
        .order('last_message_at', { ascending: false })

      if (error) throw error

      // Get the last message for each conversation
      const conversationsWithLastMessage = data?.map(conv => {
        const otherUser = conv.user1.id === userProfile.id ? conv.user2 : conv.user1
        const sortedMessages = conv.messages?.sort((a: any, b: any) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        const lastMessage = sortedMessages?.[0]
        const unreadCount = conv.messages?.filter(
          (m: any) => !m.is_read && m.sender_id !== userProfile.id
        ).length || 0

        return {
          ...conv,
          otherUser,
          lastMessage,
          unreadCount
        }
      })

      setConversations(conversationsWithLastMessage || [])
    } catch (error) {
      console.error('Error loading conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffTime = now.getTime() - date.getTime()
    const diffMinutes = Math.floor(diffTime / (1000 * 60))
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60))
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    if (diffMinutes < 1) return 'Just now'
    if (diffMinutes < 60) return `${diffMinutes}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* Professional Navigation */}
      <nav className="bg-[#2c3e50] border-b border-[#1a252f] sticky top-0 z-40 shadow-md">
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
      </nav>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Messages</h1>
          <p className="text-gray-600">Chat with clients and taskers</p>
        </div>

        {/* Conversations List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading conversations...</p>
          </div>
        ) : conversations.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center border border-gray-200">
            <svg className="w-24 h-24 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No messages yet</h3>
            <p className="text-gray-600 mb-6">Start a conversation by contacting a tasker or client</p>
            <button
              onClick={() => router.push('/browse-taskers')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Browse Taskers
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => router.push(`/messages/${conversation.id}`)}
                className="p-4 border-b border-gray-200 hover:bg-gray-50 cursor-pointer transition last:border-b-0"
              >
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {conversation.otherUser.profile_photo_url ? (
                      <img
                        src={conversation.otherUser.profile_photo_url}
                        alt={conversation.otherUser.full_name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-bold text-lg border-2 border-gray-300">
                        {conversation.otherUser.full_name?.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* Conversation Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-base font-bold text-gray-900 truncate">
                        {conversation.otherUser.full_name}
                      </h3>
                      <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                        {conversation.lastMessage && formatTimestamp(conversation.lastMessage.created_at)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-sm truncate flex-1 ${
                        conversation.unreadCount > 0 ? 'font-semibold text-gray-900' : 'text-gray-600'
                      }`}>
                        {conversation.lastMessage?.content || 'No messages yet'}
                      </p>
                      
                      {/* Unread Badge */}
                      {conversation.unreadCount > 0 && (
                        <div className="flex-shrink-0">
                          <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                            {conversation.unreadCount}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}
