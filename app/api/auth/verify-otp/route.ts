// app/api/auth/verify-otp/route.ts
// Verifies OTP from Supabase table
// Using service role to bypass email validation

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, otp, userType, fullName, password } = await request.json()

    console.log('=== VERIFY OTP STARTED ===')
    console.log('Phone:', phoneNumber)
    console.log('OTP:', otp)
    console.log('User Type:', userType)

    if (!phoneNumber || !otp) {
      return NextResponse.json(
        { error: 'Phone number and OTP are required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Find OTP in database
    const { data: otpRecord, error: otpError } = await supabase
      .from('otp_codes')
      .select('*')
      .eq('phone_number', phoneNumber)
      .eq('otp_code', otp)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (otpError || !otpRecord) {
      console.log('❌ Invalid or expired OTP')
      return NextResponse.json(
        { error: 'Invalid or expired OTP' },
        { status: 400 }
      )
    }

    console.log('✅ OTP verified!')

    // Delete used OTP
    await supabase
      .from('otp_codes')
      .delete()
      .eq('id', otpRecord.id)

    // Create user account if fullName and password provided
    if (fullName && password) {
      console.log('Creating user account...')

      const phoneDigits = phoneNumber.replace(/\+/g, '')
      const userEmail = `${phoneDigits}@kazihub.app`
      console.log('📧 Creating account with email:', userEmail)

      // ✅ Use service role client to bypass email validation
      const supabaseAdmin = createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      )

      // Create auth user with admin client (bypasses validation)
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: userEmail,
        password: password,
        email_confirm: true, // Auto-confirm since it's not a real email
        user_metadata: {
          full_name: fullName,
          phone_number: phoneNumber,
        }
      })

      if (authError) {
        console.error('Auth error:', authError)
        return NextResponse.json(
          { error: authError.message },
          { status: 400 }
        )
      }

      if (!authData.user) {
        return NextResponse.json(
          { error: 'Failed to create user' },
          { status: 500 }
        )
      }

      console.log('✅ User created:', authData.user.id)

      // Create profile (use admin client to bypass RLS)
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: authData.user.id,
          full_name: fullName,
          phone_number: phoneNumber,
          user_type: userType || 'client',
        })

      if (profileError) {
        console.error('Profile error:', profileError)
        if (profileError.code !== '23505') {
          return NextResponse.json(
            { error: 'Failed to create profile' },
            { status: 500 }
          )
        } else {
          console.log('⚠️ Profile already exists, continuing...')
        }
      } else {
        console.log('✅ Profile created')
      }

      return NextResponse.json({
        success: true,
        message: 'Account created successfully',
        user: authData.user
      })
    }

    // Just OTP verification
    return NextResponse.json({
      success: true,
      message: 'OTP verified successfully'
    })

  } catch (error: any) {
    console.error('❌ Error in verify-otp:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to verify OTP',
        details: error.message 
      },
      { status: 500 }
    )
  }
}