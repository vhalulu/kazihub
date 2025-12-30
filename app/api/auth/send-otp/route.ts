import { NextResponse } from 'next/server'
import { sendOTP, generateOTP } from '@/lib/africastalking'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const { phoneNumber } = await request.json()

    console.log('Send OTP requested for:', phoneNumber)

    // Validate phone number
    if (!phoneNumber || !phoneNumber.startsWith('+254')) {
      return NextResponse.json(
        { error: 'Invalid Kenyan phone number. Must start with +254' },
        { status: 400 }
      )
    }

    // Generate OTP
    const otp = generateOTP()
    console.log('Generated OTP:', otp) // For testing - remove in production!
    
    // Store OTP in database
    const supabase = await createClient()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    const { error: dbError } = await supabase
      .from('otp_codes')
      .insert({
        phone_number: phoneNumber,
        otp_code: otp,
        expires_at: expiresAt.toISOString(),
      })

    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json(
        { error: 'Failed to generate OTP' },
        { status: 500 }
      )
    }

    // Send OTP via SMS
    const result = await sendOTP(phoneNumber, otp)

    if (!result.success) {
      console.error('SMS send failed:', result.error)
      return NextResponse.json(
        { error: 'Failed to send SMS: ' + result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true,
      message: 'OTP sent successfully',
      // For testing only - remove in production:
      debug: { otp: otp }
    })

  } catch (error: any) {
    console.error('Send OTP error:', error)
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    )
  }
}