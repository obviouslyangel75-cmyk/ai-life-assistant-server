import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { generateCardNumber, FAN_CARD_TIERS } from '@/lib/utils'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { celebrityId, tier } = await req.json()
  if (!celebrityId || !tier) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const celebrity = await prisma.celebrity.findUnique({ where: { id: celebrityId } })
  if (!celebrity) return NextResponse.json({ error: 'Celebrity not found' }, { status: 404 })

  const tierData = FAN_CARD_TIERS.find(t => t.value === tier)
  if (!tierData) return NextResponse.json({ error: 'Invalid tier' }, { status: 400 })

  const price = celebrity.fanCardPrice * tierData.multiplier
  const cardNumber = generateCardNumber()

  const fanCard = await prisma.fanCard.create({
    data: {
      userId: session.user.id,
      celebrityId,
      tier,
      price,
      cardNumber,
    },
  })

  return NextResponse.json({ success: true, fanCard, cardNumber }, { status: 201 })
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const isAdmin = (session.user as any).role === 'admin'
  const where = isAdmin ? {} : { userId: session.user.id }

  const fanCards = await prisma.fanCard.findMany({
    where,
    include: { celebrity: { select: { name: true, imageUrl: true, slug: true } } },
    orderBy: { purchasedAt: 'desc' },
  })

  return NextResponse.json({ fanCards })
}
