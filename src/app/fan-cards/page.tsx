'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { Star, Heart, CheckCircle, Loader2, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatPrice, FAN_CARD_TIERS } from '@/lib/utils'

interface Celebrity {
  id: string
  name: string
  imageUrl: string
  category: string
  fanCardPrice: number
  slug: string
  rating: number
}

export default function FanCardsPage() {
  const { data: session } = useSession()
  const [celebrities, setCelebrities] = useState<Celebrity[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [purchasing, setPurchasing] = useState<string | null>(null)
  const [purchased, setPurchased] = useState<string | null>(null)
  const [selected, setSelected] = useState<{ celId: string; tier: string } | null>(null)

  useEffect(() => {
    fetch('/api/celebrities?limit=48')
      .then(r => r.json())
      .then(d => { setCelebrities(d.celebrities || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filtered = celebrities.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.category.toLowerCase().includes(search.toLowerCase())
  )

  async function purchase(celebrityId: string, tier: string) {
    if (!session) { toast.error('Please sign in to purchase fan cards'); return }
    setPurchasing(`${celebrityId}-${tier}`)
    try {
      const res = await fetch('/api/fan-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ celebrityId, tier }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Purchase failed')
      setPurchased(data.cardNumber)
      toast.success(`🎉 ${tier.charAt(0).toUpperCase() + tier.slice(1)} Fan Card purchased! Card: ${data.cardNumber}`)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setPurchasing(null)
    }
  }

  return (
    <div className="min-h-screen star-bg pt-20">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 opacity-20" style={{backgroundImage: 'url(https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=1400)', backgroundSize: 'cover', backgroundPosition: 'center'}} />
        <div className="absolute inset-0 bg-gradient-to-b from-navy-900/90 to-navy-900" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <div className="inline-flex items-center gap-2 bg-gold-500/20 text-gold-400 rounded-full px-4 py-1.5 text-sm mb-6">
            <Heart className="w-4 h-4 fill-current" /> Exclusive Digital Collectibles
          </div>
          <h1 className="font-display text-5xl font-bold mb-4">
            Official Celebrity <span className="text-gold-gradient">Fan Cards</span>
          </h1>
          <p className="text-white/60 text-lg max-w-2xl mx-auto mb-8">
            Collect exclusive digital fan cards from your favorite celebrities. Each card comes with unique perks, booking discounts, and access to exclusive content.
          </p>

          {/* Tiers overview */}
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            {FAN_CARD_TIERS.map(tier => (
              <div key={tier.value} className="flex items-center gap-2 bg-white/5 rounded-full px-4 py-2 border border-white/10">
                <Star className="w-4 h-4 fill-current" style={{color: tier.color}} />
                <span className="text-sm font-medium" style={{color: tier.color}}>{tier.label}</span>
                <span className="text-white/40 text-xs">{tier.multiplier}x price</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Search */}
        <div className="relative max-w-lg mx-auto mb-10">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input type="search" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search celebrities for fan cards..."
            className="w-full input-dark rounded-xl pl-11 pr-4 py-3.5 text-sm" />
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-gold-400" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(cel => (
              <div key={cel.id} className="glass-card rounded-2xl overflow-hidden">
                {/* Celebrity header */}
                <div className="flex items-center gap-4 p-5 border-b border-white/10">
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0">
                    <Image src={cel.imageUrl} alt={cel.name} fill className="object-cover"
                      onError={(e: any) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(cel.name)}&size=200&background=1a1a2e&color=f59e0b` }} />
                  </div>
                  <div className="min-w-0">
                    <Link href={`/celebrities/${cel.slug}`} className="font-bold hover:text-gold-400 transition-colors truncate block">
                      {cel.name}
                    </Link>
                    <p className="text-white/50 text-sm">{cel.category}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="w-3 h-3 text-gold-400 fill-current" />
                      <span className="text-xs">{cel.rating.toFixed(1)}</span>
                    </div>
                  </div>
                </div>

                {/* Tier cards */}
                <div className="p-5 space-y-3">
                  {FAN_CARD_TIERS.map(tier => {
                    const price = cel.fanCardPrice * tier.multiplier
                    const isLoading = purchasing === `${cel.id}-${tier.value}`
                    return (
                      <div key={tier.value} className="flex items-center justify-between p-3 rounded-xl border border-white/10 hover:border-opacity-50 transition-colors"
                        style={{borderColor: `${tier.color}20`}}>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{background: `${tier.color}20`}}>
                            <Star className="w-4 h-4 fill-current" style={{color: tier.color}} />
                          </div>
                          <div>
                            <p className="text-sm font-medium" style={{color: tier.color}}>{tier.label}</p>
                            <p className="text-xs text-white/40">{tier.perks[0]}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <p className="font-bold text-sm">{formatPrice(price)}</p>
                          <button
                            onClick={() => purchase(cel.id, tier.value)}
                            disabled={!!isLoading}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all btn-gold disabled:opacity-50">
                            {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Buy'}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Perks comparison */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <h2 className="font-display text-3xl font-bold text-center mb-10">
          Fan Card <span className="text-gold-gradient">Perks</span>
        </h2>
        <div className="glass-card rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="p-4 text-left text-white/60 text-sm">Perk</th>
                {FAN_CARD_TIERS.map(tier => (
                  <th key={tier.value} className="p-4 text-center">
                    <Star className="w-5 h-5 mx-auto mb-1 fill-current" style={{color: tier.color}} />
                    <span className="text-sm font-bold" style={{color: tier.color}}>{tier.label}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ['Digital Fan Card', true, true, true, true],
                ['Profile Badge', true, true, true, true],
                ['Monthly Newsletter', true, true, true, true],
                ['Priority Booking', false, true, true, true],
                ['Exclusive Content', false, true, true, true],
                ['Booking Discount', false, '10%', '15%', '25%'],
                ['Birthday Message', false, false, true, true],
                ['Fan Community', false, false, true, true],
                ['Annual Video Call', false, false, false, true],
                ['VIP Events Access', false, false, false, true],
              ].map((row, i) => (
                <tr key={i} className="border-b border-white/5 last:border-0 hover:bg-white/2">
                  <td className="p-4 text-sm text-white/70">{row[0]}</td>
                  {[1, 2, 3, 4].map(j => (
                    <td key={j} className="p-4 text-center">
                      {row[j] === true ? <CheckCircle className="w-4 h-4 text-gold-400 mx-auto" />
                        : row[j] === false ? <span className="text-white/20 text-lg">—</span>
                        : <span className="text-gold-400 font-bold text-sm">{row[j]}</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
