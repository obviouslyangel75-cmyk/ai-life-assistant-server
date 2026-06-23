import Anthropic from '@anthropic-ai/sdk'
import { prisma } from './db'
import { sendBookingNotificationToAdmin } from './email'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || '' })

export async function runBookingAgent(params: {
  bookingId: string
  userId: string
  celebrityName: string
  bookingType: string
  bookingDate: string
  specialRequests?: string
  price: number
  guestName: string
}) {
  const systemPrompt = `You are StarConnect Pro's elite Booking Agent AI. Your role is to:
1. Process celebrity meet & greet bookings professionally
2. Assess and flag special requests that need admin attention
3. Generate professional notes for the admin team
4. Provide personalized recommendations and risk assessments
5. Ensure all bookings meet platform standards

Respond in JSON format with these fields:
- "status": "approved" | "needs_review" | "flagged"
- "adminNotes": detailed notes for the admin team (max 200 words)
- "riskLevel": "low" | "medium" | "high"
- "recommendations": array of 2-3 action items for the admin
- "fanMessage": friendly message to show the fan (max 100 words)
- "priorityAlert": boolean - true if admin needs immediate attention`

  const userMessage = `Process this booking:
Celebrity: ${params.celebrityName}
Type: ${params.bookingType}
Date: ${params.bookingDate}
Price: $${params.price.toLocaleString()}
Guest: ${params.guestName}
Special Requests: ${params.specialRequests || 'None'}

Provide your assessment and admin notes.`

  let agentResponse = null
  let agentNotes = 'Booking received and queued for admin review.'

  try {
    if (process.env.ANTHROPIC_API_KEY) {
      const message = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        messages: [{ role: 'user', content: userMessage }],
        system: systemPrompt,
      })

      const text = message.content[0].type === 'text' ? message.content[0].text : ''
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        agentResponse = JSON.parse(jsonMatch[0])
        agentNotes = agentResponse.adminNotes || agentNotes
      }
    }
  } catch (err) {
    console.error('Agent error:', err)
  }

  // Update booking with agent notes
  await prisma.booking.update({
    where: { id: params.bookingId },
    data: { agentNotes },
  })

  // Log agent action
  await prisma.agentLog.create({
    data: {
      bookingId: params.bookingId,
      userId: params.userId,
      action: 'booking_processed',
      input: JSON.stringify(params),
      output: JSON.stringify(agentResponse),
    },
  })

  // Fetch full booking for email
  const booking = await prisma.booking.findUnique({
    where: { id: params.bookingId },
    include: { celebrity: true, user: true },
  })

  if (booking) {
    const emailResult = await sendBookingNotificationToAdmin({
      id: booking.id,
      confirmationCode: booking.confirmationCode || booking.id.slice(0, 8).toUpperCase(),
      guestName: booking.guestName || booking.user.name || 'Guest',
      guestEmail: booking.guestEmail || booking.user.email || '',
      celebrityName: booking.celebrity.name,
      type: booking.type,
      bookingDate: booking.bookingDate.toISOString(),
      duration: booking.duration,
      price: booking.price,
      specialRequests: booking.specialRequests || undefined,
      agentNotes,
    })

    await prisma.agentLog.updateMany({
      where: { bookingId: params.bookingId, action: 'booking_processed' },
      data: { emailSent: emailResult.success },
    })
  }

  return agentResponse
}

export async function runAnalyticsAgent(): Promise<string> {
  const [totalBookings, totalRevenue, totalUsers, pendingBookings] = await Promise.all([
    prisma.booking.count(),
    prisma.booking.aggregate({ _sum: { price: true } }),
    prisma.user.count({ where: { role: 'fan' } }),
    prisma.booking.count({ where: { status: 'pending' } }),
  ])

  const summary = `Platform Analytics: ${totalBookings} total bookings, $${(totalRevenue._sum.price || 0).toLocaleString()} total revenue, ${totalUsers} registered fans, ${pendingBookings} pending bookings requiring review.`

  if (!process.env.ANTHROPIC_API_KEY) return summary

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      messages: [{
        role: 'user',
        content: `As a business analytics agent for StarConnect Pro celebrity booking platform, analyze these metrics and provide a 3-sentence executive summary with 2 key recommendations: ${summary}`,
      }],
    })
    return message.content[0].type === 'text' ? message.content[0].text : summary
  } catch {
    return summary
  }
}
