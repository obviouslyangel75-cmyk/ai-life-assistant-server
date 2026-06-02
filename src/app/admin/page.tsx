'use client'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Star, Users, Calendar, Heart, DollarSign, AlertCircle, CheckCircle, TrendingUp, Bot, Loader2 } from 'lucide-react'
import { formatPrice, formatDate } from '@/lib/utils'

export default function AdminDashboard() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/stats').then(r => r.json()).then(d => { setData(d); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin text-gold-400" /></div>
  if (!data) return <div className="p-8 text-red-400">Failed to load stats</div>

  const { stats, recentBookings, topCelebrities, aiInsights } = data

  const statCards = [
    { label: 'Total Celebrities', value: stats.totalCelebrities.toLocaleString(), icon: Star, color: 'from-gold-500 to-gold-700', change: '+12 this week' },
    { label: 'Total Bookings', value: stats.totalBookings.toLocaleString(), icon: Calendar, color: 'from-blue-600 to-blue-800', change: `${stats.pendingBookings} pending` },
    { label: 'Registered Fans', value: stats.totalUsers.toLocaleString(), icon: Users, color: 'from-purple-600 to-purple-800', change: '+48 this week' },
    { label: 'Total Revenue', value: formatPrice(stats.totalRevenue), icon: DollarSign, color: 'from-green-600 to-green-800', change: '+15% this month' },
    { label: 'Fan Cards Sold', value: stats.totalFanCards.toLocaleString(), icon: Heart, color: 'from-pink-600 to-pink-800', change: 'All tiers' },
    { label: 'Pending Review', value: stats.pendingBookings.toLocaleString(), icon: AlertCircle, color: 'from-amber-600 to-amber-800', change: 'Needs attention' },
  ]

  const statusColor = (s: string) => ({ pending: 'text-amber-400', confirmed: 'text-green-400', cancelled: 'text-red-400', completed: 'text-blue-400' }[s] || 'text-white/50')

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold mb-1">Admin <span className="text-gold-gradient">Overview</span></h1>
        <p className="text-white/50 text-sm">StarConnect Pro Management Dashboard — {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
        {statCards.map(card => (
          <div key={card.label} className="glass-card rounded-2xl p-6 relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-24 h-24 rounded-full bg-gradient-to-br ${card.color} opacity-10 translate-x-6 -translate-y-6`} />
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center mb-4`}>
              <card.icon className="w-5 h-5 text-white" />
            </div>
            <p className="font-display text-2xl font-bold mb-1">{card.value}</p>
            <p className="text-white/60 text-sm">{card.label}</p>
            <p className="text-white/30 text-xs mt-1">{card.change}</p>
          </div>
        ))}
      </div>

      {/* AI Insights */}
      {aiInsights && (
        <div className="glass-card rounded-2xl p-6 mb-8 border border-purple-500/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-purple-600/20 flex items-center justify-center">
              <Bot className="w-5 h-5 text-purple-400" />
            </div>
            <h2 className="font-bold text-purple-400">AI Analytics Agent Insights</h2>
          </div>
          <p className="text-white/70 text-sm leading-relaxed">{aiInsights}</p>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent bookings */}
        <div className="xl:col-span-2 glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-bold text-lg">Recent Bookings</h2>
            <Link href="/admin/bookings" className="text-gold-400 text-sm hover:text-gold-300">View all →</Link>
          </div>
          <div className="space-y-3">
            {recentBookings.slice(0, 8).map((b: any) => (
              <div key={b.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors">
                <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0">
                  <Image src={b.celebrity?.imageUrl || ''} alt={b.celebrity?.name || ''} fill className="object-cover"
                    onError={(e: any) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(b.celebrity?.name || 'C')}&size=80&background=1a1a2e&color=f59e0b` }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{b.user?.name} → <span className="text-gold-400">{b.celebrity?.name}</span></p>
                  <p className="text-xs text-white/40">{b.type.replace('-', ' ')} · {formatDate(b.createdAt)}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-gold-400">{formatPrice(b.price)}</p>
                  <p className={`text-xs capitalize font-medium ${statusColor(b.status)}`}>{b.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top celebrities */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-bold text-lg">Top Celebrities</h2>
            <Link href="/admin/celebrities" className="text-gold-400 text-sm hover:text-gold-300">Manage →</Link>
          </div>
          <div className="space-y-4">
            {topCelebrities.map((cel: any, i: number) => (
              <div key={cel.name} className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-gold-500/20 text-gold-400 text-xs font-bold flex items-center justify-center">{i + 1}</span>
                <Image src={cel.imageUrl} alt={cel.name} width={36} height={36} className="rounded-lg object-cover"
                  onError={(e: any) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(cel.name)}&size=72&background=1a1a2e&color=f59e0b` }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{cel.name}</p>
                  <p className="text-xs text-white/40">{cel.totalBookings} bookings</p>
                </div>
                <TrendingUp className="w-4 h-4 text-green-400 shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
