// lib/send-notification-email.ts
// Helper to send email notifications from the app

export async function sendNotificationEmail(
  type: string,
  recipientEmail: string,
  data: any
) {
  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        to: recipientEmail,
        type: type,
        data: data
      })
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('Failed to send email:', error)
      return false
    }

    console.log('✅ Email notification sent successfully')
    return true
  } catch (error) {
    console.error('Error sending email notification:', error)
    return false
  }
}