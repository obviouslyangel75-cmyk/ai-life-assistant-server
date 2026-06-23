'use client'
import { useEffect, useState } from 'react'
import { BarChart3, TrendingUp, DollarSign, Users, Calendar, Star, Bot, Loader2, Download } from 'lucide-react'
import { formatPrice } from '@/lib/utils'

export default function AdminReports() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [aiInsight, setAiInsight] = useState('')

  useEffect(() => {
    fetch('/api/admin/stats').then(r => r.json()).then(d => {
      setData(d)
      setAiInsight(d.aiInsights || '')
      setLoading(false)
    })
  }, [])

  if (loading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin text-gold-400" /></div>
  if (!data) return null

  const { stats } = data
  const avgBookingValue = stats.totalBookings > 0 ? stats.totalRevenue / stats.totalBookings : 0
  const conversionRate = stats.totalUsers > 0 ? ((stats.totalBookings / stats.totalUsers) * 100).toFixed(1) : '0'

  const metrics = [
    { label: 'Total Revenue', value: formatPrice(stats.totalRevenue), icon: DollarSign, color: 'text-green-400', change: '+15%' },
    { label: 'Avg. Booking Value', value: formatPrice(avgBookingValue), icon: TrendingUp, color: 'text-blue-400', change: '+8%' },
    { label: 'Total Bookings', value: stats.totalBookings.toLocaleString(), icon: Calendar, color: 'text-gold-400', change: '+23%' },
    { label: 'Fan Conversion Rate', value: `${conversionRate}%`, icon: Users, color: 'text-purple-400', change: '+2%' },
    { label: 'Total Celebrities', value: stats.totalCelebrities.toLocaleString(), icon: Star, color: 'text-pink-400', change: '+12' },
    { label: 'Fan Cards Sold', value: stats.totalFanCards.toLocaleString(), icon: BarChart3, color: 'text-cyan-400', change: '+45%' },
  ]

  const bookingTypes = [
    { label: 'Meet & Greet', percentage: 65, color: '#f59e0b' },
    { label: 'Virtual Call', percentage: 25, color: '#7c3aed' },
    { label: 'Autograph Signing', percentage: 10, color: '#db2777' },
  ]

  const categories = [
    { label: 'Music', percentage: 35 },
    { label: 'Sports', percentage: 28 },
    { label: 'Film & TV', percentage: 22 },
    { label: 'Social Media', percentage: 10 },
    { label: 'Other', percentage: 5 },
  ]

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold mb-1">Analytics & <span className="text-gold-gradient">Reports</span></h1>
          <p className="text-white/50 text-sm">Platform performance overview</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-sm border border-white/10 transition-colors">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {metrics.map(m => (
          <div key={m.label} className="glass-card rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <m.icon className={`w-5 h-5 ${m.color}`} />
              <span className="text-xs text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">{m.change}</span>
            </div>
            <p className="font-display text-2xl font-bold mb-1">{m.value}</p>
            <p className="text-white/50 text-sm">{m.label}</p>
          </div>
        ))}
      </div>

      {/* Charts (visual representation) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Booking types */}
        <div className="glass-card rounded-2xl p-6">
          <h2 className="font-bold mb-6">Booking Type Distribution</h2>
          <div className="space-y-4">
            {bookingTypes.map(type => (
              <div key={type.label}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-white/70">{type.label}</span>
                  <span className="text-sm font-bold" style={{color: type.color}}>{type.percentage}%</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-1000" style={{width: `${type.percentage}%`, background: type.color}} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Category breakdown */}
        <div className="glass-card rounded-2xl p-6">
          <h2 className="font-bold mb-6">Bookings by Celebrity Category</h2>
          <div className="space-y-4">
            {categories.map((cat, i) => {
              const colors = ['#f59e0b', '#7c3aed', '#2563eb', '#db2777', '#059669']
              return (
                <div key={cat.label}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-white/70">{cat.label}</span>
                    <span className="text-sm font-bold" style={{color: colors[i]}}>{cat.percentage}%</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{width: `${cat.percentage}%`, background: colors[i]}} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* AI Insights */}
      {aiInsight && (
        <div className="glass-card rounded-2xl p-6 border border-purple-500/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-purple-600/20 flex items-center justify-center">
              <Bot className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h2 className="font-bold">AI Analytics Agent</h2>
              <p className="text-xs text-white/40">Powered by Claude</p>
            </div>
          </div>
          <p className="text-white/70 leading-relaxed">{aiInsight}</p>
        </div>
      )}

      {/* Recent revenue table */}
      <div className="mt-8 glass-card rounded-2xl p-6">
        <h2 className="font-bold mb-4">Key Performance Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Pending Bookings', value: stats.pendingBookings, note: 'Needs review', urgent: true },
            { label: 'Total Revenue', value: formatPrice(stats.totalRevenue), note: 'All time' },
            { label: 'Active Fans', value: stats.totalUsers.toLocaleString(), note: 'Registered' },
            { label: 'Available Stars', value: stats.totalCelebrities.toLocaleString(), note: 'In database' },
          ].map(item => (
            <div key={item.label} className={`p-4 rounded-xl ${item.urgent ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-white/5 border border-white/10'}`}>
              <p className={`font-display text-2xl font-bold ${item.urgent ? 'text-amber-400' : 'text-gold-400'}`}>{item.value}</p>
              <p className="text-sm font-medium mt-1">{item.label}</p>
              <p className="text-xs text-white/40">{item.note}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
