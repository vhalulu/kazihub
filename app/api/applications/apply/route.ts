import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { taskId, proposedPrice, message } = await request.json()

    if (!taskId || !proposedPrice || !message) {
      return NextResponse.json(
        { error: 'Task ID, proposed price, and message are required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    if (profile.user_type !== 'tasker' && profile.user_type !== 'both') {
      return NextResponse.json({ error: 'Only taskers can apply to tasks' }, { status: 403 })
    }

    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select(`*, applications:task_applications(id)`)
      .eq('id', taskId)
      .single()

    if (taskError || !task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    if (task.client_id === user.id) {
      return NextResponse.json({ error: 'You cannot apply to your own task' }, { status: 400 })
    }

    if (task.status !== 'open') {
      return NextResponse.json({ error: 'This task is no longer accepting applications' }, { status: 400 })
    }

    if (task.max_applicants) {
      const currentApplicationsCount = task.applications?.length || 0
      if (currentApplicationsCount >= task.max_applicants) {
        return NextResponse.json(
          { error: 'This task has reached its maximum number of applications and is now FULL' },
          { status: 400 }
        )
      }
    }

    const { data: existingApplication } = await supabase
      .from('task_applications')
      .select('id')
      .eq('task_id', taskId)
      .eq('tasker_id', user.id)
      .single()

    if (existingApplication) {
      return NextResponse.json({ error: 'You have already applied to this task' }, { status: 400 })
    }

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

    // Send email notification to task owner
    try {
      const { data: clientProfile } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('id', task.client_id)
        .single()

      const { data: taskerProfile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single()

      if (clientProfile?.email) {
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/send-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'new_application',
            to: clientProfile.email,
            data: {
              clientName: clientProfile.full_name,
              taskerName: taskerProfile?.full_name,
              taskTitle: task.title,
              proposedPrice,
              message,
              taskId
            }
          })
        })
        console.log('✅ Email notification sent to:', clientProfile.email)
      } else {
        console.log('⚠️ Client has no email address, skipping notification')
      }
    } catch (emailError) {
      console.error('Email notification error:', emailError)
      // Don't fail the application if email fails
    }

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