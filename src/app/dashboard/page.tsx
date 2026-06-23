'use client'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Star, Calendar, Heart, Clock, CheckCircle, XCircle, AlertCircle, Loader2, ArrowRight } from 'lucide-react'
import { formatPrice, formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [bookings, setBookings] = useState<any[]>([])
  const [fanCards, setFanCards] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  useEffect(() => {
    if (!session) return
    Promise.all([
      fetch('/api/bookings').then(r => r.json()),
      fetch('/api/fan-cards').then(r => r.json()),
    ]).then(([bookData, cardData]) => {
      setBookings(bookData.bookings || [])
      setFanCards(cardData.fanCards || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [session])

  async function cancelBooking(id: string) {
    if (!confirm('Cancel this booking?')) return
    const res = await fetch(`/api/bookings/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'cancelled' }) })
    if (res.ok) { setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'cancelled' } : b)); toast.success('Booking cancelled') }
  }

  const statusIcon = (status: string) => ({
    pending: <AlertCircle className="w-4 h-4 text-amber-400" />,
    confirmed: <CheckCircle className="w-4 h-4 text-green-400" />,
    completed: <CheckCircle className="w-4 h-4 text-blue-400" />,
    cancelled: <XCircle className="w-4 h-4 text-red-400" />,
  }[status] || <Clock className="w-4 h-4 text-white/40" />)

  const statusColor = (status: string) => ({
    pending: 'text-amber-400 bg-amber-400/10',
    confirmed: 'text-green-400 bg-green-400/10',
    completed: 'text-blue-400 bg-blue-400/10',
    cancelled: 'text-red-400 bg-red-400/10',
  }[status] || 'text-white/40 bg-white/5')

  if (status === 'loading' || loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-gold-400" /></div>
  }

  return (
    <div className="min-h-screen star-bg pt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center overflow-hidden">
              {session?.user?.image
                ? <Image src={session.user.image} alt="avatar" width={56} height={56} className="w-full h-full object-cover" />
                : <span className="text-black font-bold text-xl">{session?.user?.name?.[0]}</span>}
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold">Welcome back, {session?.user?.name?.split(' ')[0]}! ⭐</h1>
              <p className="text-white/50">{session?.user?.email}</p>
            </div>
          </div>
          <Link href="/celebrities" className="btn-gold px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2">
            Book Now <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { label: 'Total Bookings', value: bookings.length, icon: Calendar, color: 'text-blue-400' },
            { label: 'Confirmed', value: bookings.filter(b => b.status === 'confirmed').length, icon: CheckCircle, color: 'text-green-400' },
            { label: 'Pending', value: bookings.filter(b => b.status === 'pending').length, icon: Clock, color: 'text-amber-400' },
            { label: 'Fan Cards', value: fanCards.length, icon: Heart, color: 'text-pink-400' },
          ].map(stat => (
            <div key={stat.label} className="glass-card rounded-2xl p-5">
              <stat.icon className={`w-5 h-5 ${stat.color} mb-3`} />
              <p className="font-display text-3xl font-bold">{stat.value}</p>
              <p className="text-white/50 text-sm">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Bookings */}
        <div className="mb-10">
          <h2 className="font-display text-2xl font-bold mb-6">My <span className="text-gold-gradient">Bookings</span></h2>
          {bookings.length === 0 ? (
            <div className="glass-card rounded-2xl p-12 text-center">
              <Calendar className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <h3 className="font-bold text-lg mb-2">No bookings yet</h3>
              <p className="text-white/50 mb-6">Start your celebrity journey today!</p>
              <Link href="/celebrities" className="btn-gold px-6 py-3 rounded-xl font-semibold inline-flex items-center gap-2">
                Browse Celebrities <Star className="w-4 h-4 fill-current" />
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map(booking => (
                <div key={booking.id} className="glass-card rounded-2xl p-5 flex items-center gap-5">
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0">
                    <Image src={booking.celebrity?.imageUrl || ''} alt={booking.celebrity?.name || ''} fill className="object-cover"
                      onError={(e: any) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(booking.celebrity?.name || 'C')}&size=200&background=1a1a2e&color=f59e0b` }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold">{booking.celebrity?.name}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${statusColor(booking.status)}`}>
                        {statusIcon(booking.status)} {booking.status}
                      </span>
                    </div>
                    <p className="text-white/50 text-sm capitalize">{booking.type.replace('-', ' ')} — {formatDate(booking.bookingDate)}</p>
                    {booking.confirmationCode && <p className="text-white/30 text-xs mt-1">Code: {booking.confirmationCode}</p>}
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gold-400">{formatPrice(booking.price)}</p>
                    {booking.status === 'pending' && (
                      <button onClick={() => cancelBooking(booking.id)} className="text-xs text-red-400 hover:text-red-300 mt-1">Cancel</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Fan Cards */}
        <div>
          <h2 className="font-display text-2xl font-bold mb-6">My <span className="text-gold-gradient">Fan Cards</span></h2>
          {fanCards.length === 0 ? (
            <div className="glass-card rounded-2xl p-12 text-center">
              <Heart className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <h3 className="font-bold text-lg mb-2">No fan cards yet</h3>
              <p className="text-white/50 mb-6">Collect exclusive fan cards from your favorite stars!</p>
              <Link href="/fan-cards" className="btn-gold px-6 py-3 rounded-xl font-semibold inline-flex items-center gap-2">
                Browse Fan Cards <Heart className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {fanCards.map(card => {
                const tierColors: Record<string, string> = { bronze: '#cd7f32', silver: '#c0c0c0', gold: '#FFD700', platinum: '#E5E4E2' }
                const color = tierColors[card.tier] || '#f59e0b'
                return (
                  <div key={card.id} className="relative glass-card rounded-2xl p-5 border overflow-hidden" style={{borderColor: `${color}30`}}>
                    <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10" style={{background: color, transform: 'translate(30%, -30%)'}} />
                    <div className="flex items-center gap-3 mb-4">
                      <Image src={card.celebrity.imageUrl} alt={card.celebrity.name} width={40} height={40} className="rounded-lg object-cover"
                        onError={(e: any) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(card.celebrity.name)}&size=80&background=1a1a2e&color=f59e0b` }} />
                      <div>
                        <p className="font-bold text-sm">{card.celebrity.name}</p>
                        <p className="text-xs font-medium capitalize" style={{color}}>{card.tier} Card</p>
                      </div>
                      <Star className="w-6 h-6 ml-auto fill-current" style={{color}} />
                    </div>
                    <p className="text-xs text-white/40 font-mono mb-2">{card.cardNumber}</p>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white/40">Purchased {formatDate(card.purchasedAt)}</span>
                      <span className="font-bold" style={{color}}>{formatPrice(card.price)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
