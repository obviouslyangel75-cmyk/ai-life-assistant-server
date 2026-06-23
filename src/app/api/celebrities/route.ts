import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q') || ''
  const category = searchParams.get('category') || ''
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '24')

  const where: any = { available: true }
  if (q) where.OR = [
    { name: { contains: q } },
    { category: { contains: q } },
    { tags: { contains: q } },
  ]
  if (category) where.category = category

  const [celebrities, total] = await Promise.all([
    prisma.celebrity.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { featured: 'desc' } }),
    prisma.celebrity.count({ where }),
  ])

  return NextResponse.json({ celebrities, total })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if ((session?.user as any)?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { name, category, subcategory, bio, nationality, imageUrl, meetPrice, virtualPrice, signingPrice, fanCardPrice, featured, tags } = body

  if (!name || !category || !meetPrice) return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })

  const slug = slugify(name)
  const celebrity = await prisma.celebrity.create({
    data: {
      name, slug, category, subcategory: subcategory || null, bio: bio || '',
      nationality: nationality || null, imageUrl: imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=400&background=1a1a2e&color=f59e0b`,
      meetPrice: parseFloat(meetPrice),
      virtualPrice: virtualPrice ? parseFloat(virtualPrice) : parseFloat(meetPrice) * 0.3,
      signingPrice: signingPrice ? parseFloat(signingPrice) : parseFloat(meetPrice) * 0.2,
      fanCardPrice: fanCardPrice ? parseFloat(fanCardPrice) : 29.99,
      featured: featured || false,
      tags: tags || '',
    },
  })

  return NextResponse.json({ success: true, celebrity }, { status: 201 })
}
