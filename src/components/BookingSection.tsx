'use client'
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Calendar, Clock, Star, CheckCircle, Loader2 } from 'lucide-react'
import { formatPrice } from '@/lib/utils'

interface Experience {
  type: string
  label: string
  price: number
  icon: string
  duration: number
  desc: string
}

interface Celebrity {
  id: string
  name: string
  imageUrl: string
}

interface Props {
  celebrity: Celebrity
  experiences: Experience[]
}

export function BookingSection({ celebrity, experiences }: Props) {
  const { data: session } = useSession()
  const router = useRouter()
  const [selected, setSelected] = useState(experiences[0])
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [requests, setRequests] = useState('')
  const [loading, setLoading] = useState(false)
  const [confirmed, setConfirmed] = useState<{code: string; fanMsg: string} | null>(null)

  const minDate = new Date()
  minDate.setDate(minDate.getDate() + 3)

  async function handleBook(e: React.FormEvent) {
    e.preventDefault()
    if (!session) { router.push('/login'); return }
    if (!date || !time || !name || !email) { toast.error('Please fill all required fields'); return }

    setLoading(true)
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          celebrityId: celebrity.id,
          type: selected.type,
          bookingDate: `${date}T${time}:00`,
          duration: selected.duration,
          price: selected.price,
          guestName: name,
          guestEmail: email,
          guestPhone: phone,
          specialRequests: requests,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Booking failed')
      setConfirmed({ code: data.confirmationCode, fanMsg: data.fanMessage || '' })
      toast.success('🎉 Booking submitted successfully!')
    } catch (err: any) {
      toast.error(err.message || 'Failed to create booking')
    } finally {
      setLoading(false)
    }
  }

  if (confirmed) {
    return (
      <div className="glass-card rounded-3xl p-10 text-center border border-gold-500/30">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center">
          <CheckCircle className="w-10 h-10 text-black" />
        </div>
        <h2 className="font-display text-3xl font-bold mb-2">Booking Submitted! 🎉</h2>
        <p className="text-white/60 mb-6">Your request has been received and our team will confirm shortly.</p>
        <div className="bg-gold-500/10 border border-gold-500/20 rounded-2xl p-6 mb-6 inline-block">
          <p className="text-white/50 text-sm mb-1">Confirmation Code</p>
          <p className="font-display text-4xl font-bold text-gold-400 tracking-widest">{confirmed.code}</p>
        </div>
        {confirmed.fanMsg && <p className="text-white/60 text-sm mb-6 italic">"{confirmed.fanMsg}"</p>}
        <p className="text-white/50 text-sm">A confirmation email has been sent. You'll hear from us within 24-48 hours.</p>
        <button onClick={() => { setConfirmed(null); setDate(''); setTime(''); setName(''); setEmail(''); setRequests('') }}
          className="mt-6 btn-gold px-6 py-3 rounded-xl font-semibold">
          Book Another Experience
        </button>
      </div>
    )
  }

  return (
    <div>
      <h2 className="font-display text-2xl font-bold mb-6">
        Book an <span className="text-gold-gradient">Experience</span>
      </h2>

      {/* Experience selector */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {experiences.map(exp => (
          <button key={exp.type} onClick={() => setSelected(exp)}
            className={`p-5 rounded-2xl border text-left transition-all ${selected.type === exp.type ? 'border-gold-500 bg-gold-500/10' : 'glass-card border-white/10 hover:border-gold-500/30'}`}>
            <span className="text-3xl mb-3 block">{exp.icon}</span>
            <p className="font-bold text-sm mb-1">{exp.label}</p>
            <p className="text-white/50 text-xs mb-3">{exp.desc}</p>
            <div className="flex items-center justify-between">
              <span className="font-bold text-gold-400">{formatPrice(exp.price)}</span>
              <span className="text-xs text-white/40 flex items-center gap-1"><Clock className="w-3 h-3" /> {exp.duration}min</span>
            </div>
          </button>
        ))}
      </div>

      {/* Booking form */}
      <form onSubmit={handleBook} className="glass-card rounded-2xl p-6 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-white/60 mb-1.5">Date *</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              min={minDate.toISOString().split('T')[0]}
              className="w-full input-dark rounded-xl px-4 py-3 text-sm" required />
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1.5">Time *</label>
            <input type="time" value={time} onChange={e => setTime(e.target.value)}
              className="w-full input-dark rounded-xl px-4 py-3 text-sm" required />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-white/60 mb-1.5">Full Name *</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Your name"
              className="w-full input-dark rounded-xl px-4 py-3 text-sm" required />
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1.5">Email *</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com"
              className="w-full input-dark rounded-xl px-4 py-3 text-sm" required />
          </div>
        </div>
        <div>
          <label className="block text-sm text-white/60 mb-1.5">Phone</label>
          <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 (555) 000-0000"
            className="w-full input-dark rounded-xl px-4 py-3 text-sm" />
        </div>
        <div>
          <label className="block text-sm text-white/60 mb-1.5">Special Requests or Notes</label>
          <textarea value={requests} onChange={e => setRequests(e.target.value)} rows={3} placeholder="Any special requests, accessibility needs, or notes for the celebrity..."
            className="w-full input-dark rounded-xl px-4 py-3 text-sm resize-none" />
        </div>

        {/* Price summary */}
        <div className="rounded-xl bg-gold-500/10 border border-gold-500/20 p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-white/60">{selected.label}</p>
            <p className="font-bold text-xl text-gold-400">{formatPrice(selected.price)}</p>
          </div>
          <div className="text-right text-sm text-white/50">
            <p>Duration: {selected.duration} min</p>
            <p>With {celebrity.name}</p>
          </div>
        </div>

        <button type="submit" disabled={loading}
          className="w-full btn-gold py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3">
          {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</> : <><Star className="w-5 h-5 fill-current" /> Book Now — {formatPrice(selected.price)}</>}
        </button>
        {!session && <p className="text-center text-sm text-white/40">You&apos;ll be asked to sign in to complete your booking.</p>}
      </form>
    </div>
  )
}
