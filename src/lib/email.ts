import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'management.team@mail.com'
const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'StarConnect Pro'

export async function sendBookingNotificationToAdmin(booking: {
  id: string
  confirmationCode: string
  guestName: string
  guestEmail: string
  celebrityName: string
  type: string
  bookingDate: string
  duration: number
  price: number
  specialRequests?: string
  agentNotes?: string
}) {
  const subject = `⭐ New Booking Alert — ${booking.confirmationCode}`
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #fff; border-radius: 12px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #f59e0b, #d97706); padding: 30px; text-align: center;">
        <h1 style="margin: 0; font-size: 28px; color: #fff;">⭐ ${APP_NAME}</h1>
        <p style="margin: 5px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">New Booking Notification</p>
      </div>
      <div style="padding: 30px;">
        <h2 style="color: #f59e0b; margin-top: 0;">New Booking Received!</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
            <td style="padding: 12px 0; color: rgba(255,255,255,0.6); width: 40%;">Confirmation Code</td>
            <td style="padding: 12px 0; font-weight: bold; color: #f59e0b; font-size: 18px;">${booking.confirmationCode}</td>
          </tr>
          <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
            <td style="padding: 12px 0; color: rgba(255,255,255,0.6);">Guest Name</td>
            <td style="padding: 12px 0;">${booking.guestName}</td>
          </tr>
          <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
            <td style="padding: 12px 0; color: rgba(255,255,255,0.6);">Guest Email</td>
            <td style="padding: 12px 0;">${booking.guestEmail}</td>
          </tr>
          <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
            <td style="padding: 12px 0; color: rgba(255,255,255,0.6);">Celebrity</td>
            <td style="padding: 12px 0; font-weight: bold;">${booking.celebrityName}</td>
          </tr>
          <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
            <td style="padding: 12px 0; color: rgba(255,255,255,0.6);">Experience Type</td>
            <td style="padding: 12px 0; text-transform: capitalize;">${booking.type.replace('-', ' ')}</td>
          </tr>
          <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
            <td style="padding: 12px 0; color: rgba(255,255,255,0.6);">Date & Time</td>
            <td style="padding: 12px 0;">${new Date(booking.bookingDate).toLocaleString()}</td>
          </tr>
          <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
            <td style="padding: 12px 0; color: rgba(255,255,255,0.6);">Duration</td>
            <td style="padding: 12px 0;">${booking.duration} minutes</td>
          </tr>
          <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
            <td style="padding: 12px 0; color: rgba(255,255,255,0.6);">Price</td>
            <td style="padding: 12px 0; font-weight: bold; color: #f59e0b; font-size: 18px;">$${booking.price.toLocaleString()}</td>
          </tr>
          ${booking.specialRequests ? `
          <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
            <td style="padding: 12px 0; color: rgba(255,255,255,0.6);">Special Requests</td>
            <td style="padding: 12px 0;">${booking.specialRequests}</td>
          </tr>` : ''}
          ${booking.agentNotes ? `
          <tr>
            <td style="padding: 12px 0; color: rgba(255,255,255,0.6);">AI Agent Notes</td>
            <td style="padding: 12px 0; color: #7c3aed;">${booking.agentNotes}</td>
          </tr>` : ''}
        </table>
        <div style="margin-top: 24px; padding: 16px; background: rgba(245,158,11,0.1); border-left: 4px solid #f59e0b; border-radius: 4px;">
          <p style="margin: 0; color: rgba(255,255,255,0.8);">⚡ Action Required: Please review and confirm this booking in your admin dashboard.</p>
        </div>
      </div>
      <div style="padding: 20px; text-align: center; background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.4); font-size: 12px;">
        <p style="margin: 0;">${APP_NAME} — Admin Notification System</p>
        <p style="margin: 4px 0 0;">This email was sent to ${ADMIN_EMAIL}</p>
      </div>
    </div>
  `

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || `${APP_NAME} <noreply@starconnect.pro>`,
      to: ADMIN_EMAIL,
      subject,
      html,
    })
    return { success: true }
  } catch (error) {
    console.error('Email send error:', error)
    return { success: false, error }
  }
}

export async function sendBookingConfirmationToFan(booking: {
  confirmationCode: string
  guestName: string
  guestEmail: string
  celebrityName: string
  type: string
  bookingDate: string
  price: number
}) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #fff; border-radius: 12px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #f59e0b, #d97706); padding: 30px; text-align: center;">
        <h1 style="margin: 0; font-size: 28px; color: #fff;">⭐ ${APP_NAME}</h1>
        <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9);">Booking Request Received!</p>
      </div>
      <div style="padding: 30px;">
        <h2 style="color: #f59e0b;">Hi ${booking.guestName}! 🎉</h2>
        <p style="color: rgba(255,255,255,0.8); line-height: 1.6;">Your booking request for <strong style="color: #f59e0b;">${booking.celebrityName}</strong> has been received and is being reviewed.</p>
        <div style="background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.3); border-radius: 12px; padding: 20px; margin: 24px 0;">
          <p style="margin: 0 0 8px; color: rgba(255,255,255,0.6); font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Confirmation Code</p>
          <p style="margin: 0; font-size: 32px; font-weight: bold; color: #f59e0b; letter-spacing: 4px;">${booking.confirmationCode}</p>
        </div>
        <p style="color: rgba(255,255,255,0.6); font-size: 14px;">Keep this code safe. You'll need it to check your booking status.</p>
        <p style="color: rgba(255,255,255,0.8); line-height: 1.6; margin-top: 24px;">Our team will review your request and confirm within 24-48 hours. You'll receive another email with full details once confirmed.</p>
      </div>
      <div style="padding: 20px; text-align: center; background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.4); font-size: 12px;">
        <p style="margin: 0;">${APP_NAME} — Where Every Fan Meets Their Star</p>
      </div>
    </div>
  `

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || `${APP_NAME} <noreply@starconnect.pro>`,
      to: booking.guestEmail,
      subject: `✅ Booking Request Received — ${booking.confirmationCode}`,
      html,
    })
    return { success: true }
  } catch (error) {
    console.error('Fan email error:', error)
    return { success: false, error }
  }
}
