// lib/notifications.ts
// Helper functions for creating notifications

import { createClient } from '@/lib/supabase/client'

export type NotificationType = 
  | 'new_application'      // Client receives: Tasker applied to your task
  | 'application_accepted' // Tasker receives: Your application was accepted
  | 'application_rejected' // Tasker receives: Your application was rejected
  | 'task_completed'       // Tasker receives: Client marked task as complete
  | 'new_message'          // User receives: New message in conversation
  | 'review_received'      // User receives: Someone left you a review
  | 'task_posted'          // Taskers receive: New task in their area (optional)
  | 'payment_received'     // User receives: Payment confirmed (for M-Pesa later)

interface CreateNotificationParams {
  userId: string
  type: NotificationType
  title: string
  message: string
  actionUrl?: string
  taskId?: string
  applicationId?: string
  messageId?: string
  reviewId?: string
  fromUserId?: string
}

/**
 * Create a notification for a user
 */
export async function createNotification(params: CreateNotificationParams) {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('notifications')
    .insert({
      user_id: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      action_url: params.actionUrl,
      task_id: params.taskId,
      application_id: params.applicationId,
      message_id: params.messageId,
      review_id: params.reviewId,
      from_user_id: params.fromUserId
    })

  if (error) {
    console.error('Error creating notification:', error)
    throw error
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: string) {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('notifications')
    .update({ 
      is_read: true,
      read_at: new Date().toISOString()
    })
    .eq('id', notificationId)

  if (error) {
    console.error('Error marking notification as read:', error)
    throw error
  }
}

/**
 * Mark all notifications as read for current user
 */
export async function markAllNotificationsAsRead(userId: string) {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('notifications')
    .update({ 
      is_read: true,
      read_at: new Date().toISOString()
    })
    .eq('user_id', userId)
    .eq('is_read', false)

  if (error) {
    console.error('Error marking all notifications as read:', error)
    throw error
  }
}

/**
 * Get unread notification count
 */
export async function getUnreadCount(userId: string): Promise<number> {
  const supabase = createClient()
  
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false)

  if (error) {
    console.error('Error getting unread count:', error)
    return 0
  }

  return count || 0
}

/**
 * Get recent notifications for user
 */
export async function getNotifications(userId: string, limit: number = 20) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('notifications')
    .select(`
      *,
      from_user:profiles!notifications_from_user_id_fkey(
        full_name,
        profile_photo_url
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error getting notifications:', error)
    return []
  }

  return data || []
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string) {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId)

  if (error) {
    console.error('Error deleting notification:', error)
    throw error
  }
}