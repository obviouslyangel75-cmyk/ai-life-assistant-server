import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const isAdmin = (session.user as any).role === 'admin'
  const body = await req.json()
  const { status, adminNotes } = body

  const booking = await prisma.booking.findUnique({ where: { id: params.id } })
  if (!booking) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!isAdmin && booking.userId !== (session.user as any).id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const update: any = {}
  if (status) {
    update.status = status
    if (status === 'confirmed') update.confirmedAt = new Date()
    if (status === 'cancelled') update.cancelledAt = new Date()
  }
  if (isAdmin && adminNotes !== undefined) update.adminNotes = adminNotes

  const updated = await prisma.booking.update({ where: { id: params.id }, data: update })
  return NextResponse.json({ success: true, booking: updated })
}
