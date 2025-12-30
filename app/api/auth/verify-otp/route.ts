import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    const { phoneNumber, otp, fullName, password, userType } = await request.json()

    console.log('=== VERIFY OTP STARTED ===')
    console.log('Phone:', phoneNumber)
    console.log('User Type:', userType)

    const supabase = await createClient()

    // Verify OTP
    const { data: otpData, error: otpError } = await supabase
      .from('otp_codes')
      .select('*')
      .eq('phone_number', phoneNumber)
      .eq('otp_code', otp)
      .eq('is_used', false)
      .single()

    if (otpError || !otpData) {
      return NextResponse.json(
        { error: 'Invalid or expired OTP' },
        { status: 400 }
      )
    }

    // Check expiration
    if (new Date(otpData.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'OTP has expired. Please request a new one.' },
        { status: 400 }
      )
    }

    // Mark OTP as used
    await supabase
      .from('otp_codes')
      .update({ is_used: true })
      .eq('id', otpData.id)

    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const email = `${phoneNumber.replace('+', '')}@kazihub.app`
    
    // Validate user type
    const validUserTypes = ['client', 'tasker', 'both']
    const safeUserType = validUserTypes.includes(userType) ? userType : 'client'
    
    console.log('Step 1: Creating auth user...')

    // Create user - trigger will automatically create profile!
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        phone_number: phoneNumber,
        user_type: safeUserType,
      }
    })

    if (authError) {
      console.error('❌ Auth error:', authError)
      
      if (authError.message.includes('already registered')) {
        return NextResponse.json(
          { error: 'This phone number is already registered. Please login instead.' },
          { status: 400 }
        )
      }
      
      return NextResponse.json(
        { error: 'Failed to create account: ' + authError.message },
        { status: 400 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'No user returned from signup' },
        { status: 500 }
      )
    }

    console.log('✅ User created:', authData.user.id)

    // Wait a moment for trigger to complete
    await new Promise(resolve => setTimeout(resolve, 500))

    // Verify profile was created by trigger
    console.log('Step 2: Verifying profile...')
    const { data: profile, error: profileCheckError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    if (profileCheckError || !profile) {
      console.warn('⚠️ Trigger did not create profile, creating manually...')
      
      // Fallback: Create profile manually
      const { error: manualProfileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: authData.user.id,
          full_name: fullName,
          phone_number: phoneNumber,
          user_type: safeUserType,
        })
      
      if (manualProfileError && !manualProfileError.message.includes('duplicate')) {
        console.error('❌ Manual profile creation failed:', manualProfileError)
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
        return NextResponse.json(
          { error: 'Failed to create profile' },
          { status: 500 }
        )
      }
      
      console.log('✅ Profile created manually (fallback)')
    } else {
      console.log('✅ Profile created by trigger!')
      console.log('   Name:', profile.full_name)
      console.log('   Phone:', profile.phone_number)
      console.log('   Type:', profile.user_type)
    }

    // Auto sign-in
    console.log('Step 3: Auto signing in...')
    const { error: sessionError } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    })

    if (sessionError) {
      console.log('⚠️ Auto sign-in warning:', sessionError.message)
    } else {
      console.log('✅ User signed in successfully!')
    }

    console.log('=== SIGNUP COMPLETE ===')

    return NextResponse.json({ 
      success: true,
      message: 'Account created successfully!',
      user: authData.user
    })

  } catch (error: any) {
    console.error('❌ Unexpected error:', error)
    return NextResponse.json(
      { error: 'Something went wrong: ' + error.message },
      { status: 500 }
    )
  }
}