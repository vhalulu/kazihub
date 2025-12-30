import { createClient } from '@/lib/supabase/client'

export async function startConversation(otherUserId: string, taskId?: string) {
  const supabase = createClient()
  
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('Not authenticated')
    }

    // Check if conversation already exists (either direction)
    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .or(`and(user1_id.eq.${user.id},user2_id.eq.${otherUserId}),and(user1_id.eq.${otherUserId},user2_id.eq.${user.id})`)
      .single()

    if (existing) {
      // Conversation exists, return its ID
      return existing.id
    }

    // Create new conversation
    const { data: newConv, error } = await supabase
      .from('conversations')
      .insert({
        user1_id: user.id,
        user2_id: otherUserId,
        task_id: taskId || null
      })
      .select('id')
      .single()

    if (error) throw error

    return newConv.id
  } catch (error) {
    console.error('Error starting conversation:', error)
    throw error
  }
}
