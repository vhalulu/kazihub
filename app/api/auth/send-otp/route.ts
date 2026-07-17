// app/api/auth/send-otp/route.ts
// Sends OTP via Mobivas SMS

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function sendSMSViaMobivas(phone: string, message: string): Promise<boolean> {
  try {
    // Remove + from phone number for Mobivas
    const cleanPhone = phone.replace('+', '')

    const payload = {
      MessageParameters: [
        {
          Text: message,
          Number: cleanPhone
        }
      ],
      ApiKey: process.env.MOBIVAS_API_KEY!,
      SenderId: process.env.MOBIVAS_SENDER_ID || 'TAIFA',
      ClientId: process.env.MOBIVAS_CLIENT_ID!
    }

    console.log('📱 Sending SMS via Mobivas to:', cleanPhone)

    const res = await fetch('http://user.smsmobivas.co.ke/api/v2/SendBulkSMS', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    })

    const data = await res.json()
    console.log('Mobivas response:', JSON.stringify(data))

    // ErrorCode 0 = success
    if (data.ErrorCode === '0' || data.ErrorCode === 0) {
      console.log('✅ SMS sent successfully via Mobivas')
      return true
    }

    console.error('❌ Mobivas SMS failed:', data)
    return false

  } catch (error) {
    console.error('❌ Mobivas SMS error:', error)
    return false
  }
}

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
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        is_used: false,
      })

    if (insertError) {
      console.error('Error storing OTP:', insertError)
      return NextResponse.json(
        { error: 'Failed to generate OTP' },
        { status: 500 }
      )
    }

    console.log('✅ OTP stored in Supabase')

    // Send OTP via Mobivas
    const message = `Your KaziHub verification code is: ${otp}. Valid for 10 minutes. Do not share this code with anyone.`
    const sent = await sendSMSViaMobivas(phoneNumber, message)

    if (!sent) {
      console.error('❌ Failed to send SMS via Mobivas')
      // Don't fail the request - OTP is stored, user can check manually
      return NextResponse.json({ 
        success: true,
        message: 'OTP generated but SMS delivery failed. Please try again.',
        smsDelivered: false
      })
    }

    return NextResponse.json({ 
      success: true,
      message: 'OTP sent to your phone number',
      smsDelivered: true
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