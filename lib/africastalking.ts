const africastalking = require('africastalking')({
  apiKey: process.env.AFRICASTALKING_API_KEY,
  username: process.env.AFRICASTALKING_USERNAME,
})

const sms = africastalking.SMS

// Generate 6-digit OTP
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Send OTP via SMS
export async function sendOTP(phoneNumber: string, otp: string) {
  try {
    const options: any = {
      to: [phoneNumber],
      message: `Your KaziHub verification code is: ${otp}\n\nValid for 10 minutes.`,
    }
    
    // Add sender ID if provided
    if (process.env.AFRICASTALKING_SHORTCODE) {
      options.from = process.env.AFRICASTALKING_SHORTCODE
    }
    
    const result = await sms.send(options)
    
    console.log('SMS sent:', result)
    return { success: true, result }
  } catch (error: any) {
    console.error('SMS Error:', error)
    return { success: false, error: error.message }
  }
}