import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { taskId, proposedPrice, message } = await request.json()

    // Validate inputs
    if (!taskId || !proposedPrice || !message) {
      return NextResponse.json(
        { error: 'Task ID, proposed price, and message are required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user profile to verify they're a tasker
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    // Verify user is a tasker or both
    if (profile.user_type !== 'tasker' && profile.user_type !== 'both') {
      return NextResponse.json(
        { error: 'Only taskers can apply to tasks' },
        { status: 403 }
      )
    }

    // Get task details with applications count
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select(`
        *,
        applications:task_applications(id)
      `)
      .eq('id', taskId)
      .single()

    if (taskError || !task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    // Check if user is trying to apply to their own task
    if (task.client_id === user.id) {
      return NextResponse.json(
        { error: 'You cannot apply to your own task' },
        { status: 400 }
      )
    }

    // Check if task is still open
    if (task.status !== 'open') {
      return NextResponse.json(
        { error: 'This task is no longer accepting applications' },
        { status: 400 }
      )
    }

    // CRITICAL: Check if task is FULL
    if (task.max_applicants) {
      const currentApplicationsCount = task.applications?.length || 0
      
      if (currentApplicationsCount >= task.max_applicants) {
        return NextResponse.json(
          { error: 'This task has reached its maximum number of applications and is now FULL' },
          { status: 400 }
        )
      }
    }

    // Check if user has already applied
    const { data: existingApplication, error: existingError } = await supabase
      .from('task_applications')
      .select('id')
      .eq('task_id', taskId)
      .eq('tasker_id', user.id)
      .single()

    if (existingApplication) {
      return NextResponse.json(
        { error: 'You have already applied to this task' },
        { status: 400 }
      )
    }

    // Create the application
    const { data: application, error: applicationError } = await supabase
      .from('task_applications')
      .insert({
        task_id: taskId,
        tasker_id: user.id,
        proposed_price: proposedPrice,
        message: message,
        status: 'pending'
      })
      .select()
      .single()

    if (applicationError) throw applicationError

    // TODO: Send notification to task owner
    // This will be implemented in the notifications module

    return NextResponse.json({ 
      success: true,
      message: 'Application submitted successfully',
      application
    })

  } catch (error: any) {
    console.error('Apply to task error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to submit application' },
      { status: 500 }
    )
  }
}