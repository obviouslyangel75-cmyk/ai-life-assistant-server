import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { generateConfirmationCode } from '@/lib/utils'
import { runBookingAgent } from '@/lib/agent'
import { sendBookingConfirmationToFan } from '@/lib/email'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { celebrityId, type, bookingDate, duration, price, guestName, guestEmail, guestPhone, specialRequests } = body

  if (!celebrityId || !type || !bookingDate || !price) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const celebrity = await prisma.celebrity.findUnique({ where: { id: celebrityId } })
  if (!celebrity) return NextResponse.json({ error: 'Celebrity not found' }, { status: 404 })

  const confirmationCode = generateConfirmationCode()

  const booking = await prisma.booking.create({
    data: {
      userId: session.user.id,
      celebrityId,
      bookingDate: new Date(bookingDate),
      duration: duration || 30,
      type,
      price,
      guestName: guestName || session.user.name,
      guestEmail: guestEmail || session.user.email,
      guestPhone: guestPhone || null,
      specialRequests: specialRequests || null,
      confirmationCode,
      status: 'pending',
    },
  })

  // Increment celebrity booking count
  await prisma.celebrity.update({
    where: { id: celebrityId },
    data: { totalBookings: { increment: 1 } },
  })

  // Run AI agent (non-blocking)
  let fanMessage = `Thank you for booking with ${celebrity.name}! Your request is under review.`
  runBookingAgent({
    bookingId: booking.id,
    userId: session.user.id,
    celebrityName: celebrity.name,
    bookingType: type,
    bookingDate,
    specialRequests,
    price,
    guestName: guestName || session.user.name || 'Guest',
  }).then(agentResult => {
    if (agentResult?.fanMessage) fanMessage = agentResult.fanMessage
  }).catch(console.error)

  // Send fan confirmation
  sendBookingConfirmationToFan({
    confirmationCode,
    guestName: guestName || session.user.name || 'Fan',
    guestEmail: guestEmail || session.user.email || '',
    celebrityName: celebrity.name,
    type,
    bookingDate,
    price,
  }).catch(console.error)

  return NextResponse.json({ success: true, bookingId: booking.id, confirmationCode, fanMessage })
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const isAdmin = (session.user as any).role === 'admin'
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = 20

  const where: any = isAdmin ? {} : { userId: session.user.id }
  if (status) where.status = status

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where, skip: (page - 1) * limit, take: limit,
      include: { celebrity: { select: { name: true, imageUrl: true, slug: true } }, user: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.booking.count({ where }),
  ])

  return NextResponse.json({ bookings, total, pages: Math.ceil(total / limit) })
}
