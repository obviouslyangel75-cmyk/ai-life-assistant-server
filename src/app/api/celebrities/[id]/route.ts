import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if ((session?.user as any)?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const cel = await prisma.celebrity.update({
    where: { id: params.id },
    data: {
      name: body.name,
      category: body.category,
      subcategory: body.subcategory,
      bio: body.bio,
      nationality: body.nationality,
      imageUrl: body.imageUrl,
      meetPrice: body.meetPrice ? parseFloat(body.meetPrice) : undefined,
      virtualPrice: body.virtualPrice ? parseFloat(body.virtualPrice) : undefined,
      signingPrice: body.signingPrice ? parseFloat(body.signingPrice) : undefined,
      fanCardPrice: body.fanCardPrice ? parseFloat(body.fanCardPrice) : undefined,
      featured: body.featured,
      available: body.available,
      tags: body.tags,
    },
  })
  return NextResponse.json({ success: true, celebrity: cel })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if ((session?.user as any)?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  await prisma.celebrity.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
