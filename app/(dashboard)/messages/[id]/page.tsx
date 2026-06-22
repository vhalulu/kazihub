'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function ChatPage() {
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [userProfile, setUserProfile] = useState<any>(null)
  const [conversation, setConversation] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    checkUserAccess()
  }, [])

  useEffect(() => {
    if (userProfile && params.id) {
      loadConversation()
      loadMessages()
      markMessagesAsRead()

      // Subscribe to new messages
      const channel = supabase
        .channel(`conversation-${params.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${params.id}`
          },
          (payload) => {
            setMessages(prev => [...prev, payload.new])
            markMessagesAsRead()
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [userProfile, params.id])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

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

  const loadConversation = async () => {
    try {
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
          )
        `)
        .eq('id', params.id)
        .single()

      if (error) throw error

      // Determine who the other user is
      const otherUser = data.user1.id === userProfile.id ? data.user2 : data.user1

      setConversation({ ...data, otherUser })
    } catch (error) {
      console.error('Error loading conversation:', error)
      alert('Conversation not found')
      router.push('/messages')
    } finally {
      setLoading(false)
    }
  }

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', params.id)
        .order('created_at', { ascending: true })

      if (error) throw error

      setMessages(data || [])
    } catch (error) {
      console.error('Error loading messages:', error)
    }
  }

  const markMessagesAsRead = async () => {
    try {
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', params.id)
        .eq('is_read', false)
        .neq('sender_id', userProfile.id)
    } catch (error) {
      console.error('Error marking messages as read:', error)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newMessage.trim()) return

    const messageContent = newMessage.trim()
    setNewMessage('') // Clear input immediately
    setSending(true)

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: params.id,
          sender_id: userProfile.id,
          content: messageContent
        })
        .select()
        .single()

      if (error) throw error

      // Add message to UI immediately (optimistic update)
      setMessages(prev => [...prev, data])
      scrollToBottom()
    } catch (error: any) {
      console.error('Error sending message:', error)
      alert(error.message || 'Failed to send message')
      // Restore message on error
      setNewMessage(messageContent)
    } finally {
      setSending(false)
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    } else if (diffDays === 1) {
      return 'Yesterday ' + date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' + 
             date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    }
  }

  if (loading || !conversation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading chat...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      
      {/* Professional Header */}
      <nav className="bg-[#2c3e50] border-b border-[#1a252f] shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/messages" className="text-gray-300 hover:text-white transition flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="text-sm">Back</span>
              </Link>
              <div className="flex items-center gap-3">
                {conversation.otherUser.profile_photo_url ? (
                  <img
                    src={conversation.otherUser.profile_photo_url}
                    alt={conversation.otherUser.full_name}
                    className="w-10 h-10 rounded-full object-cover border-2 border-blue-500"
                  />
                ) : (
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-bold border-2 border-blue-500">
                    {conversation.otherUser.full_name?.charAt(0).toUpperCase()}
                  </div>
                )}
                <h1 className="text-lg font-bold text-white">
                  {conversation.otherUser.full_name}
                </h1>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto bg-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-24 h-24 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="text-gray-600">No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map((message) => {
                const isMine = message.sender_id === userProfile.id
                return (
                  <div key={message.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-md ${isMine ? 'order-2' : 'order-1'}`}>
                      <div className={`rounded-2xl px-4 py-3 ${
                        isMine 
                          ? 'bg-[#007AFF]' 
                          : 'bg-gray-200'
                      }`}>
                        <p className={`whitespace-pre-wrap break-words ${
                          isMine ? '!text-white' : 'text-gray-900'
                        }`}>
                          {message.content}
                        </p>
                      </div>
                      <p className={`text-xs text-gray-500 mt-1 ${isMine ? 'text-right' : 'text-left'}`}>
                        {formatTimestamp(message.created_at)}
                      </p>
                    </div>
                  </div>
                )
              })
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* Message Input */}
      <div className="bg-white border-t border-gray-300 shadow-lg">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <form onSubmit={handleSendMessage} className="flex gap-3">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              disabled={sending}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={sending || !newMessage.trim()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? 'Sending...' : 'Send'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
