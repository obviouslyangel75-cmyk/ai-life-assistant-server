'use client'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Heart, Star, Loader2, Search } from 'lucide-react'
import { formatPrice, formatDate } from '@/lib/utils'

const TIER_COLORS: Record<string, string> = { bronze: '#cd7f32', silver: '#c0c0c0', gold: '#FFD700', platinum: '#E5E4E2' }

export default function AdminFanCards() {
  const [fanCards, setFanCards] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/fan-cards').then(r => r.json()).then(d => { setFanCards(d.fanCards || []); setLoading(false) })
  }, [])

  const filtered = fanCards.filter(c =>
    !search || c.celebrity?.name?.toLowerCase().includes(search.toLowerCase()) || c.cardNumber?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold mb-1">Fan <span className="text-gold-gradient">Cards</span></h1>
        <p className="text-white/50 text-sm">{fanCards.length} fan cards issued</p>
      </div>
      <div className="relative max-w-md mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search fan cards..." className="w-full input-dark rounded-xl pl-10 pr-4 py-2.5 text-sm" />
      </div>
      {loading ? <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-gold-400" /></div> : (
        <div className="glass-card rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead><tr className="border-b border-white/10">
              {['Card Number', 'Celebrity', 'Tier', 'Price', 'Purchased', 'Active'].map(h => <th key={h} className="p-4 text-left text-xs text-white/60">{h}</th>)}
            </tr></thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} className="border-b border-white/5 hover:bg-white/2">
                  <td className="p-4 text-xs font-mono text-white/60">{c.cardNumber}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Image src={c.celebrity.imageUrl} alt="" width={28} height={28} className="rounded-lg object-cover"
                        onError={(e: any) => { e.target.src = `https://ui-avatars.com/api/?name=C&size=56&background=1a1a2e&color=f59e0b` }} />
                      <span className="text-sm">{c.celebrity.name}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5 fill-current" style={{color: TIER_COLORS[c.tier]}} />
                      <span className="text-sm capitalize font-medium" style={{color: TIER_COLORS[c.tier]}}>{c.tier}</span>
                    </div>
                  </td>
                  <td className="p-4 text-sm font-bold text-gold-400">{formatPrice(c.price)}</td>
                  <td className="p-4 text-sm text-white/60">{formatDate(c.purchasedAt)}</td>
                  <td className="p-4">
                    <span className={`text-xs px-2 py-1 rounded-full ${c.isActive ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                      {c.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
