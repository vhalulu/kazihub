// app/api/send-email/route.ts
// API route for sending email notifications via Resend

import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import {
  getNewApplicationEmail,
  getApplicationAcceptedEmail,
  getTaskCompletedEmail,
  getNewMessageEmail,
  getReviewReceivedEmail
} from '@/lib/email-templates'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const { type, to, data } = await request.json()

    if (!to || !type || !data) {
      return NextResponse.json(
        { error: 'Missing required fields: to, type, data' },
        { status: 400 }
      )
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(to)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      )
    }

    // Get email template based on type
    let emailContent
    
    switch (type) {
      case 'new_application':
        emailContent = getNewApplicationEmail(data)
        break
      case 'application_accepted':
        emailContent = getApplicationAcceptedEmail(data)
        break
      case 'task_completed':
        emailContent = getTaskCompletedEmail(data)
        break
      case 'new_message':
        emailContent = getNewMessageEmail(data)
        break
      case 'review_received':
        emailContent = getReviewReceivedEmail(data)
        break
      default:
        return NextResponse.json(
          { error: `Unknown email type: ${type}` },
          { status: 400 }
        )
    }

    // Send email via Resend
    const response = await resend.emails.send({
      from: 'onboarding@resend.dev', // Resend's test email (works immediately)
      to: [to],
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text
    })

    console.log('Email sent successfully:', response)

    // Check if response has error
    if (response.error) {
      return NextResponse.json(
        { 
          success: false,
          error: response.error.message 
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      messageId: response.data?.id || 'unknown'
    })

  } catch (error: any) {
    console.error('Error sending email:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to send email',
        details: error.message 
      },
      { status: 500 }
    )
  }
}
