import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { applicationId } = await request.json()

    if (!applicationId) {
      return NextResponse.json(
        { error: 'Application ID is required' },
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

    // Get the application details
    const { data: application, error: appError } = await supabase
      .from('task_applications')
      .select('*, task:tasks(*)')
      .eq('id', applicationId)
      .single()

    if (appError || !application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      )
    }

    // Verify the user owns this task
    if (application.task.client_id !== user.id) {
      return NextResponse.json(
        { error: 'You can only accept applications for your own tasks' },
        { status: 403 }
      )
    }

    // Verify task is still open
    if (application.task.status !== 'open') {
      return NextResponse.json(
        { error: 'This task is no longer accepting applications' },
        { status: 400 }
      )
    }

    // Start transaction: Accept this application, reject others, update task
    
    // 1. Accept the selected application
    const { error: acceptError } = await supabase
      .from('task_applications')
      .update({ status: 'accepted' })
      .eq('id', applicationId)

    if (acceptError) throw acceptError

    // 2. Reject all other pending applications for this task
    const { error: rejectError } = await supabase
      .from('task_applications')
      .update({ 
        status: 'rejected',
        rejection_message: 'Thank you for your application. The client has selected another tasker for this task. We encourage you to keep applying to other opportunities!'
      })
      .eq('task_id', application.task.id)
      .eq('status', 'pending')
      .neq('id', applicationId)

    if (rejectError) throw rejectError

    // 3. Update task status to in_progress and set assigned_tasker_id
    const { error: taskError } = await supabase
      .from('tasks')
      .update({ 
        status: 'in_progress',
        assigned_tasker_id: application.tasker_id
      })
      .eq('id', application.task.id)

    if (taskError) throw taskError

    // TODO: Send notifications to tasker (accepted) and other applicants (rejected)
    // This will be implemented in the notifications module

    return NextResponse.json({ 
      success: true,
      message: 'Application accepted successfully'
    })

  } catch (error: any) {
    console.error('Accept application error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to accept application' },
      { status: 500 }
    )
  }
}