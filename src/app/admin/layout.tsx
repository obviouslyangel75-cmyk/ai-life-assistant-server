'use client'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Star, LayoutDashboard, Users, Calendar, Heart, BarChart3, Plus, Settings, Loader2 } from 'lucide-react'

const navItems = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/admin/celebrities', label: 'Celebrities', icon: Star },
  { href: '/admin/bookings', label: 'Bookings', icon: Calendar },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/fan-cards', label: 'Fan Cards', icon: Heart },
  { href: '/admin/reports', label: 'Reports', icon: BarChart3 },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (status === 'loading') return
    if (!session || (session.user as any)?.role !== 'admin') router.push('/')
  }, [session, status, router])

  if (status === 'loading') return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-gold-400" /></div>
  if ((session?.user as any)?.role !== 'admin') return null

  return (
    <div className="min-h-screen star-bg pt-16 flex">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 border-r border-white/10 bg-navy-800/50 backdrop-blur-xl flex flex-col min-h-[calc(100vh-4rem)] sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 bg-gradient-gold rounded-lg flex items-center justify-center">
              <Star className="w-4 h-4 text-black fill-current" />
            </div>
            <span className="font-display font-bold text-gold-gradient">Admin Panel</span>
          </div>
          <p className="text-white/40 text-xs">StarConnect Pro Management</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(item => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
            return (
              <Link key={item.href} href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${active ? 'admin-nav-active' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}>
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gold-500/10">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-black font-bold text-xs">A</div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{session?.user?.name}</p>
              <p className="text-xs text-gold-400">Super Admin</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 min-w-0 overflow-hidden">{children}</main>
    </div>
  )
}
