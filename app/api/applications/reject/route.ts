import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { applicationId, rejectionMessage } = await request.json()

    console.log('=== REJECT API DEBUG ===')
    console.log('Application ID:', applicationId)
    console.log('Rejection Message:', rejectionMessage)
    console.log('========================')

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
        { error: 'You can only reject applications for your own tasks' },
        { status: 403 }
      )
    }

    const finalMessage = rejectionMessage || 'Thank you for your application. We have decided to move forward with another candidate.'
    
    console.log('Final message to save:', finalMessage)

    // Update application status to rejected with message
    const { data: updateData, error: rejectError } = await supabase
      .from('task_applications')
      .update({ 
        status: 'rejected',
        rejection_message: finalMessage
      })
      .eq('id', applicationId)
      .select()

    console.log('Update result:', updateData)
    console.log('Update error:', rejectError)

    if (rejectError) throw rejectError

    return NextResponse.json({ 
      success: true,
      message: 'Application rejected with kindness',
      savedMessage: finalMessage
    })

  } catch (error: any) {
    console.error('Reject application error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to reject application' },
      { status: 500 }
    )
  }
}
