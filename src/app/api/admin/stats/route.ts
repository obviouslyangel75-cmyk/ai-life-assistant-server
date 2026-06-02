import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { runAnalyticsAgent } from '@/lib/agent'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if ((session?.user as any)?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const [totalCelebrities, totalBookings, totalUsers, totalFanCards, revenueData, pendingBookings, recentBookings, topCelebrities] = await Promise.all([
    prisma.celebrity.count(),
    prisma.booking.count(),
    prisma.user.count({ where: { role: 'fan' } }),
    prisma.fanCard.count(),
    prisma.booking.aggregate({ _sum: { price: true } }),
    prisma.booking.count({ where: { status: 'pending' } }),
    prisma.booking.findMany({
      take: 10, orderBy: { createdAt: 'desc' },
      include: { celebrity: { select: { name: true } }, user: { select: { name: true, email: true } } },
    }),
    prisma.celebrity.findMany({ take: 5, orderBy: { totalBookings: 'desc' }, select: { name: true, totalBookings: true, imageUrl: true } }),
  ])

  let aiInsights = ''
  try { aiInsights = await runAnalyticsAgent() } catch { aiInsights = '' }

  return NextResponse.json({
    stats: {
      totalCelebrities,
      totalBookings,
      totalUsers,
      totalFanCards,
      totalRevenue: revenueData._sum.price || 0,
      pendingBookings,
    },
    recentBookings,
    topCelebrities,
    aiInsights,
  })
}
