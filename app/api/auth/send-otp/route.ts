// app/api/auth/send-otp/route.ts
// Stores OTP in Supabase, skips SMS sending temporarily

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber } = await request.json()

    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      )
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    
    console.log('=================================')
    console.log('📱 Send OTP requested for:', phoneNumber)
    console.log('🔑 Generated OTP:', otp)
    console.log('=================================')

    const supabase = await createClient()

    // Store OTP in Supabase database
    const { error: insertError } = await supabase
      .from('otp_codes')
      .insert({
        phone_number: phoneNumber,
        otp_code: otp,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
      })

    if (insertError) {
      console.error('Error storing OTP:', insertError)
      return NextResponse.json(
        { error: 'Failed to generate OTP' },
        { status: 500 }
      )
    }

    console.log('✅ OTP stored in Supabase')
    console.log('💡 Check otp_codes table to see OTP:', otp)

    // SKIP SMS SENDING FOR NOW
    console.log('⚠️ SMS DISABLED - OTP saved in database')
    console.log('⚠️ Check Supabase otp_codes table')

    // Return success
    return NextResponse.json({ 
      success: true,
      message: 'OTP generated (check Supabase otp_codes table)',
      // Show OTP in development
      developmentOTP: process.env.NODE_ENV === 'development' ? otp : undefined
    })

  } catch (error: any) {
    console.error('❌ Error in send-otp:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to send OTP',
        details: error.message 
      },
      { status: 500 }
    )
  }
}
