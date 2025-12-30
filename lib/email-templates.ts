// lib/email-templates.ts
// Email templates for KaziHub notifications

interface EmailTemplate {
  subject: string
  html: string
  text: string
}

export function getNewApplicationEmail(data: {
  clientName: string
  taskerName: string
  taskTitle: string
  proposedRate: number
  taskUrl: string
}): EmailTemplate {
  return {
    subject: `New Application: ${data.taskerName} applied to "${data.taskTitle}"`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #0891b2 0%, #0e7490 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #0891b2; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
          .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0891b2; }
          .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📋 New Application Received!</h1>
          </div>
          <div class="content">
            <p>Hi ${data.clientName},</p>
            
            <p><strong>${data.taskerName}</strong> has applied to your task:</p>
            
            <div class="info-box">
              <h3 style="margin-top: 0;">${data.taskTitle}</h3>
              <p style="margin: 10px 0;"><strong>Proposed Rate:</strong> KSh ${data.proposedRate.toLocaleString()}</p>
            </div>
            
            <p>Review their profile, experience, and message to decide if they're the right fit for your task.</p>
            
            <center>
              <a href="${data.taskUrl}" class="button">Review Application →</a>
            </center>
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
              💡 <strong>Tip:</strong> Respond quickly to get the best taskers! Popular taskers often have multiple offers.
            </p>
          </div>
          <div class="footer">
            <p>This email was sent by KaziHub</p>
            <p>If you didn't expect this email, you can safely ignore it.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Hi ${data.clientName},

${data.taskerName} has applied to your task: "${data.taskTitle}"

Proposed Rate: KSh ${data.proposedRate.toLocaleString()}

Review their application here: ${data.taskUrl}

Tip: Respond quickly to get the best taskers!

---
This email was sent by KaziHub
    `
  }
}

export function getApplicationAcceptedEmail(data: {
  taskerName: string
  clientName: string
  taskTitle: string
  agreedRate: number
  taskUrl: string
}): EmailTemplate {
  return {
    subject: `🎉 You Got Hired! - ${data.taskTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f0fdf4; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
          .success-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981; }
          .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Congratulations!</h1>
            <h2 style="margin-top: 10px; font-weight: normal;">You Got Hired!</h2>
          </div>
          <div class="content">
            <p>Hi ${data.taskerName},</p>
            
            <p>Great news! <strong>${data.clientName}</strong> has accepted your application!</p>
            
            <div class="success-box">
              <h3 style="margin-top: 0;">${data.taskTitle}</h3>
              <p style="margin: 10px 0;"><strong>Agreed Rate:</strong> KSh ${data.agreedRate.toLocaleString()}</p>
            </div>
            
            <p><strong>Next Steps:</strong></p>
            <ol>
              <li>Contact the client to confirm details</li>
              <li>Agree on start date and timeline</li>
              <li>Complete the task professionally</li>
              <li>Get paid and receive your review!</li>
            </ol>
            
            <center>
              <a href="${data.taskUrl}" class="button">View Task Details →</a>
            </center>
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
              💡 <strong>Tip:</strong> Communicate clearly and deliver quality work to get 5-star reviews!
            </p>
          </div>
          <div class="footer">
            <p>This email was sent by KaziHub</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Hi ${data.taskerName},

Congratulations! ${data.clientName} has accepted your application!

Task: ${data.taskTitle}
Agreed Rate: KSh ${data.agreedRate.toLocaleString()}

Next Steps:
1. Contact the client to confirm details
2. Agree on start date and timeline
3. Complete the task professionally
4. Get paid and receive your review!

View task details: ${data.taskUrl}

---
This email was sent by KaziHub
    `
  }
}

export function getTaskCompletedEmail(data: {
  taskerName: string
  clientName: string
  taskTitle: string
  reviewUrl: string
}): EmailTemplate {
  return {
    subject: `Task Completed: "${data.taskTitle}" - Leave a Review`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #eff6ff; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
          .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6; }
          .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Task Completed!</h1>
          </div>
          <div class="content">
            <p>Hi ${data.taskerName},</p>
            
            <p><strong>${data.clientName}</strong> has marked the following task as completed:</p>
            
            <div class="info-box">
              <h3 style="margin-top: 0;">${data.taskTitle}</h3>
            </div>
            
            <p>🌟 <strong>Leave a review to help others!</strong></p>
            <p>Share your experience working with ${data.clientName}. Your review helps build trust in the KaziHub community.</p>
            
            <center>
              <a href="${data.reviewUrl}" class="button">Leave a Review →</a>
            </center>
          </div>
          <div class="footer">
            <p>This email was sent by KaziHub</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Hi ${data.taskerName},

${data.clientName} has marked the task "${data.taskTitle}" as completed!

Leave a review to help others: ${data.reviewUrl}

Your review helps build trust in the KaziHub community.

---
This email was sent by KaziHub
    `
  }
}

export function getNewMessageEmail(data: {
  recipientName: string
  senderName: string
  messagePreview: string
  conversationUrl: string
}): EmailTemplate {
  return {
    subject: `New message from ${data.senderName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #ec4899 0%, #db2777 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #fdf2f8; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #ec4899; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
          .message-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ec4899; font-style: italic; }
          .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💬 New Message</h1>
          </div>
          <div class="content">
            <p>Hi ${data.recipientName},</p>
            
            <p>You have a new message from <strong>${data.senderName}</strong>:</p>
            
            <div class="message-box">
              <p>${data.messagePreview}</p>
            </div>
            
            <center>
              <a href="${data.conversationUrl}" class="button">View Message →</a>
            </center>
          </div>
          <div class="footer">
            <p>This email was sent by KaziHub</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Hi ${data.recipientName},

You have a new message from ${data.senderName}:

"${data.messagePreview}"

View message: ${data.conversationUrl}

---
This email was sent by KaziHub
    `
  }
}

export function getReviewReceivedEmail(data: {
  recipientName: string
  reviewerName: string
  rating: number
  comment: string
  taskTitle: string
  profileUrl: string
}): EmailTemplate {
  const stars = '⭐'.repeat(data.rating)
  
  return {
    subject: `${data.reviewerName} left you a ${data.rating}-star review!`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #fffbeb; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
          .review-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b; }
          .stars { font-size: 24px; margin: 10px 0; }
          .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⭐ New Review!</h1>
          </div>
          <div class="content">
            <p>Hi ${data.recipientName},</p>
            
            <p><strong>${data.reviewerName}</strong> left you a review for the task: <strong>${data.taskTitle}</strong></p>
            
            <div class="review-box">
              <div class="stars">${stars}</div>
              <p style="margin-top: 15px;">"${data.comment}"</p>
            </div>
            
            <center>
              <a href="${data.profileUrl}" class="button">View Your Profile →</a>
            </center>
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
              Great reviews help you get more work on KaziHub. Keep up the excellent service! 🌟
            </p>
          </div>
          <div class="footer">
            <p>This email was sent by KaziHub</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Hi ${data.recipientName},

${data.reviewerName} left you a ${data.rating}-star review for: ${data.taskTitle}

${stars}

"${data.comment}"

View your profile: ${data.profileUrl}

Great reviews help you get more work on KaziHub!

---
This email was sent by KaziHub
    `
  }
}