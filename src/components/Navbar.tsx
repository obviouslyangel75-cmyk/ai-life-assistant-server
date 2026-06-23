'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { Star, Menu, X, ChevronDown, Bell, LogOut, User, Settings, LayoutDashboard } from 'lucide-react'
import { cn } from '@/lib/utils'
import Image from 'next/image'

export function Navbar() {
  const { data: session } = useSession()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  const navLinks = [
    { href: '/celebrities', label: 'Celebrities' },
    { href: '/fan-cards', label: 'Fan Cards' },
    { href: '/celebrities?category=Music', label: 'Music' },
    { href: '/celebrities?category=Sports', label: 'Sports' },
    { href: '/celebrities?category=Film+%26+TV', label: 'Film & TV' },
  ]

  return (
    <nav className={cn(
      'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
      scrolled ? 'bg-navy-900/95 backdrop-blur-xl border-b border-gold-500/20 shadow-xl' : 'bg-transparent'
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-gradient-gold rounded-lg flex items-center justify-center shadow-gold group-hover:shadow-gold-lg transition-all">
              <Star className="w-5 h-5 text-black fill-current" />
            </div>
            <div>
              <span className="font-display font-bold text-xl text-gold-gradient">StarConnect</span>
              <sup className="text-gold-400 text-xs font-bold ml-0.5">PRO</sup>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map(link => (
              <Link key={link.href} href={link.href}
                className="text-white/70 hover:text-gold-400 text-sm font-medium transition-colors hover:drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]">
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {session ? (
              <div className="relative">
                <button onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 bg-white/5 hover:bg-white/10 rounded-full pl-1 pr-3 py-1 transition-all border border-white/10 hover:border-gold-500/30">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center overflow-hidden">
                    {session.user?.image
                      ? <Image src={session.user.image} alt="avatar" width={32} height={32} className="w-full h-full object-cover" />
                      : <span className="text-black font-bold text-sm">{session.user?.name?.[0] || 'U'}</span>
                    }
                  </div>
                  <span className="text-sm font-medium hidden sm:block">{session.user?.name?.split(' ')[0]}</span>
                  <ChevronDown className="w-4 h-4 text-white/50" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-12 w-52 glass-card rounded-xl shadow-card overflow-hidden z-50">
                    <div className="p-3 border-b border-white/10">
                      <p className="text-sm font-medium">{session.user?.name}</p>
                      <p className="text-xs text-white/50">{session.user?.email}</p>
                      {(session.user as any)?.role === 'admin' && (
                        <span className="text-xs bg-gold-500/20 text-gold-400 px-2 py-0.5 rounded-full mt-1 inline-block">Admin</span>
                      )}
                    </div>
                    <div className="p-1">
                      <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 text-sm transition-colors" onClick={() => setUserMenuOpen(false)}>
                        <LayoutDashboard className="w-4 h-4 text-gold-400" /> My Dashboard
                      </Link>
                      {(session.user as any)?.role === 'admin' && (
                        <Link href="/admin" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 text-sm transition-colors" onClick={() => setUserMenuOpen(false)}>
                          <Settings className="w-4 h-4 text-gold-400" /> Admin Panel
                        </Link>
                      )}
                      <button onClick={() => signOut({ callbackUrl: '/' })}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-500/10 text-sm text-red-400 transition-colors w-full">
                        <LogOut className="w-4 h-4" /> Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/login" className="text-sm text-white/70 hover:text-white transition-colors hidden sm:block">Sign In</Link>
                <Link href="/login?signup=1" className="btn-gold text-sm px-5 py-2 rounded-full">Join Now</Link>
              </div>
            )}

            {/* Mobile menu */}
            <button className="lg:hidden p-2 rounded-lg hover:bg-white/10 transition-colors" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="lg:hidden bg-navy-800/98 backdrop-blur-xl border-t border-white/10">
          <div className="px-4 py-4 space-y-1">
            {navLinks.map(link => (
              <Link key={link.href} href={link.href}
                className="block px-4 py-3 rounded-lg hover:bg-white/5 text-white/70 hover:text-gold-400 transition-colors"
                onClick={() => setMenuOpen(false)}>
                {link.label}
              </Link>
            ))}
            {!session && (
              <div className="pt-2 border-t border-white/10 flex flex-col gap-2 mt-2">
                <Link href="/login" className="block text-center py-3 rounded-lg border border-white/20 text-sm">Sign In</Link>
                <Link href="/login?signup=1" className="block text-center btn-gold py-3 rounded-lg text-sm">Join Now</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
