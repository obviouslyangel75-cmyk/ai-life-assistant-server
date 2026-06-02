import { NextRequest, NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
  const { name, email, password } = await req.json()
  if (!name || !email || !password) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  if (password.length < 6) return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })

  const exists = await prisma.user.findUnique({ where: { email } })
  if (exists) return NextResponse.json({ error: 'Email already registered' }, { status: 409 })

  const hashedPassword = await hash(password, 12)
  const user = await prisma.user.create({
    data: {
      name, email, password: hashedPassword, role: 'fan',
      image: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=7c3aed&color=fff&size=200`,
    },
  })

  return NextResponse.json({ success: true, userId: user.id }, { status: 201 })
}
