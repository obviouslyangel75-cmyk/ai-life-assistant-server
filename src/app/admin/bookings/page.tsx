'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { CheckCircle, XCircle, Clock, AlertCircle, Loader2, Search, Filter } from 'lucide-react'
import { formatPrice, formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function AdminBookings() {
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [search, setSearch] = useState('')
  const [updating, setUpdating] = useState<string | null>(null)
  const [selected, setSelected] = useState<any | null>(null)

  const load = () => {
    const url = `/api/bookings?${filter ? `status=${filter}` : ''}`
    fetch(url).then(r => r.json()).then(d => { setBookings(d.bookings || []); setLoading(false) })
  }
  useEffect(load, [filter])

  async function updateStatus(id: string, status: string, adminNotes?: string) {
    setUpdating(id)
    const res = await fetch(`/api/bookings/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status, adminNotes }) })
    if (res.ok) {
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status, adminNotes } : b))
      setSelected(null)
      toast.success(`Booking ${status}`)
    } else toast.error('Update failed')
    setUpdating(null)
  }

  const filtered = bookings.filter(b =>
    !search || b.celebrity?.name?.toLowerCase().includes(search.toLowerCase()) ||
    b.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
    b.confirmationCode?.toLowerCase().includes(search.toLowerCase())
  )

  const statusIcon = (s: string) => ({ pending: <AlertCircle className="w-4 h-4 text-amber-400" />, confirmed: <CheckCircle className="w-4 h-4 text-green-400" />, cancelled: <XCircle className="w-4 h-4 text-red-400" />, completed: <CheckCircle className="w-4 h-4 text-blue-400" /> }[s])
  const statusColor = (s: string) => ({ pending: 'text-amber-400 bg-amber-400/10', confirmed: 'text-green-400 bg-green-400/10', cancelled: 'text-red-400 bg-red-400/10', completed: 'text-blue-400 bg-blue-400/10' }[s] || '')

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold mb-1">Manage <span className="text-gold-gradient">Bookings</span></h1>
        <p className="text-white/50 text-sm">{bookings.length} bookings {filter ? `with status: ${filter}` : 'total'}</p>
      </div>

      <div className="flex flex-wrap gap-4 mb-6">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search bookings..." className="w-full input-dark rounded-xl pl-10 pr-4 py-2.5 text-sm" />
        </div>
        <div className="flex gap-2">
          {['', 'pending', 'confirmed', 'completed', 'cancelled'].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${filter === s ? 'bg-gold-500 text-black' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}>
              {s || 'All'}
            </button>
          ))}
        </div>
      </div>

      {loading ? <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-gold-400" /></div> : (
        <div className="glass-card rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="p-4 text-left text-xs text-white/60">Celebrity</th>
                <th className="p-4 text-left text-xs text-white/60">Fan</th>
                <th className="p-4 text-left text-xs text-white/60">Type</th>
                <th className="p-4 text-left text-xs text-white/60">Date</th>
                <th className="p-4 text-left text-xs text-white/60">Price</th>
                <th className="p-4 text-left text-xs text-white/60">Status</th>
                <th className="p-4 text-left text-xs text-white/60">Code</th>
                <th className="p-4 text-right text-xs text-white/60">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(b => (
                <tr key={b.id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Image src={b.celebrity?.imageUrl || ''} alt="" width={28} height={28} className="rounded-lg object-cover"
                        onError={(e: any) => { e.target.src = `https://ui-avatars.com/api/?name=C&size=56&background=1a1a2e&color=f59e0b` }} />
                      <span className="text-sm font-medium">{b.celebrity?.name}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <p className="text-sm">{b.guestName || b.user?.name}</p>
                    <p className="text-xs text-white/40">{b.guestEmail || b.user?.email}</p>
                  </td>
                  <td className="p-4 text-sm text-white/60 capitalize">{b.type?.replace('-', ' ')}</td>
                  <td className="p-4 text-sm text-white/60">{formatDate(b.bookingDate)}</td>
                  <td className="p-4 text-sm font-bold text-gold-400">{formatPrice(b.price)}</td>
                  <td className="p-4">
                    <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full w-fit font-medium ${statusColor(b.status)}`}>
                      {statusIcon(b.status)} {b.status}
                    </span>
                  </td>
                  <td className="p-4 text-xs text-white/40 font-mono">{b.confirmationCode}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => setSelected(b)} className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs">View</button>
                      {b.status === 'pending' && <>
                        <button onClick={() => updateStatus(b.id, 'confirmed')} disabled={updating === b.id}
                          className="px-3 py-1 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-400 text-xs">Confirm</button>
                        <button onClick={() => updateStatus(b.id, 'cancelled')} disabled={updating === b.id}
                          className="px-3 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs">Reject</button>
                      </>}
                      {b.status === 'confirmed' && (
                        <button onClick={() => updateStatus(b.id, 'completed')} disabled={updating === b.id}
                          className="px-3 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-xs">Complete</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Booking detail modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="glass-card rounded-2xl w-full max-w-lg p-6">
            <h3 className="font-bold text-lg mb-4">Booking Detail</h3>
            <div className="space-y-3 text-sm">
              {[
                ['Confirmation', selected.confirmationCode],
                ['Celebrity', selected.celebrity?.name],
                ['Guest', selected.guestName || selected.user?.name],
                ['Email', selected.guestEmail || selected.user?.email],
                ['Phone', selected.guestPhone || '—'],
                ['Type', selected.type?.replace('-', ' ')],
                ['Date', formatDate(selected.bookingDate)],
                ['Duration', `${selected.duration} min`],
                ['Price', formatPrice(selected.price)],
                ['Status', selected.status],
                ['Special Requests', selected.specialRequests || 'None'],
                ['AI Agent Notes', selected.agentNotes || 'Processing...'],
                ['Admin Notes', selected.adminNotes || 'None'],
              ].map(([k, v]) => (
                <div key={k} className="flex gap-3 py-1.5 border-b border-white/5">
                  <span className="text-white/40 w-36 shrink-0">{k}</span>
                  <span className={k === 'Status' ? 'capitalize font-medium text-gold-400' : ''}>{v}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setSelected(null)} className="flex-1 py-2.5 rounded-xl border border-white/20 text-sm">Close</button>
              {selected.status === 'pending' && (
                <button onClick={() => updateStatus(selected.id, 'confirmed')} className="flex-1 py-2.5 rounded-xl btn-gold text-sm font-semibold">Confirm Booking</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
