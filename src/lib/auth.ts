import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import GitHubProvider from 'next-auth/providers/github'
import CredentialsProvider from 'next-auth/providers/credentials'
import { compare } from 'bcryptjs'
import { prisma } from './db'

export const authOptions: NextAuthOptions = {
  // JWT strategy — no database adapter needed; works on serverless (Netlify/Vercel)
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      allowDangerousEmailAccountLinking: true,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID ?? '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET ?? '',
      allowDangerousEmailAccountLinking: true,
    }),
    CredentialsProvider({
      name: 'Email',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null
        const user = await prisma.user.findUnique({ where: { email: credentials.email } })
        if (!user?.password) return null
        const valid = await compare(credentials.password, user.password)
        if (!valid) return null
        return { id: user.id, email: user.email!, name: user.name, image: user.image, role: user.role }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // Auto-create Firestore user record for OAuth sign-ins
      if (account?.provider === 'google' || account?.provider === 'github') {
        try {
          const existing = await prisma.user.findUnique({ where: { email: user.email! } })
          if (!existing) {
            await prisma.user.create({
              data: {
                name: user.name,
                email: user.email!,
                image: user.image,
                role: 'fan',
              },
            })
          }
        } catch (err) {
          console.error('signIn user-create error:', err)
        }
      }
      return true
    },

    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role ?? 'fan'
      }
      if (token.email && !token.role) {
        try {
          const dbUser = await prisma.user.findUnique({ where: { email: token.email } })
          token.id = dbUser?.id ?? token.sub
          token.role = dbUser?.role ?? 'fan'
        } catch {}
      }
      return token
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.role = (token.role as string) ?? 'fan'
      }
      return session
    },
  },
}
