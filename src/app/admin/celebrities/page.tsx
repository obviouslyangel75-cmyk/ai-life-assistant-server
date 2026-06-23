'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Star, Plus, Edit, Trash2, Search, Loader2, CheckCircle, XCircle, X } from 'lucide-react'
import { formatPrice, CATEGORIES } from '@/lib/utils'
import toast from 'react-hot-toast'

interface Celebrity {
  id: string; name: string; category: string; subcategory?: string; imageUrl: string;
  meetPrice: number; rating: number; verified: boolean; featured: boolean; available: boolean; totalBookings: number
}

export default function AdminCelebrities() {
  const [celebrities, setCelebrities] = useState<Celebrity[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Celebrity | null>(null)
  const [form, setForm] = useState({ name: '', category: '', subcategory: '', bio: '', nationality: '', imageUrl: '', meetPrice: '', virtualPrice: '', signingPrice: '', fanCardPrice: '', tags: '', featured: false, available: true })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/celebrities?limit=100').then(r => r.json()).then(d => { setCelebrities(d.celebrities || []); setLoading(false) })
  }, [])

  const filtered = celebrities.filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.category.toLowerCase().includes(search.toLowerCase()))

  function openEdit(cel: Celebrity) {
    setEditing(cel)
    setForm({ name: cel.name, category: cel.category, subcategory: cel.subcategory || '', bio: '', nationality: '', imageUrl: cel.imageUrl, meetPrice: String(cel.meetPrice), virtualPrice: '', signingPrice: '', fanCardPrice: '', tags: '', featured: cel.featured, available: cel.available })
    setShowModal(true)
  }

  function openNew() {
    setEditing(null)
    setForm({ name: '', category: '', subcategory: '', bio: '', nationality: '', imageUrl: '', meetPrice: '', virtualPrice: '', signingPrice: '', fanCardPrice: '', tags: '', featured: false, available: true })
    setShowModal(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const url = editing ? `/api/celebrities/${editing.id}` : '/api/celebrities'
      const method = editing ? 'PATCH' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      if (!res.ok) throw new Error('Failed to save')
      const data = await res.json()
      if (editing) setCelebrities(prev => prev.map(c => c.id === editing.id ? { ...c, ...data.celebrity } : c))
      else { const r2 = await fetch('/api/celebrities?limit=100').then(r => r.json()); setCelebrities(r2.celebrities || []) }
      toast.success(editing ? 'Celebrity updated!' : 'Celebrity added!')
      setShowModal(false)
    } catch { toast.error('Save failed') } finally { setSaving(false) }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete ${name}? This cannot be undone.`)) return
    const res = await fetch(`/api/celebrities/${id}`, { method: 'DELETE' })
    if (res.ok) { setCelebrities(prev => prev.filter(c => c.id !== id)); toast.success('Deleted') }
    else toast.error('Delete failed')
  }

  async function toggleAvailable(id: string, current: boolean) {
    const res = await fetch(`/api/celebrities/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ available: !current }) })
    if (res.ok) setCelebrities(prev => prev.map(c => c.id === id ? { ...c, available: !current } : c))
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold mb-1">Manage <span className="text-gold-gradient">Celebrities</span></h1>
          <p className="text-white/50 text-sm">{celebrities.length} celebrities in database</p>
        </div>
        <button onClick={openNew} className="btn-gold flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold">
          <Plus className="w-4 h-4" /> Add Celebrity
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search celebrities..."
          className="w-full input-dark rounded-xl pl-11 pr-4 py-3 text-sm" />
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-gold-400" /></div>
      ) : (
        <div className="glass-card rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 bg-white/2">
                <th className="p-4 text-left text-sm text-white/60 font-medium">Celebrity</th>
                <th className="p-4 text-left text-sm text-white/60 font-medium">Category</th>
                <th className="p-4 text-left text-sm text-white/60 font-medium">Meet Price</th>
                <th className="p-4 text-left text-sm text-white/60 font-medium">Bookings</th>
                <th className="p-4 text-left text-sm text-white/60 font-medium">Status</th>
                <th className="p-4 text-right text-sm text-white/60 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(cel => (
                <tr key={cel.id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <Image src={cel.imageUrl} alt={cel.name} width={36} height={36} className="rounded-lg object-cover"
                        onError={(e: any) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(cel.name)}&size=72&background=1a1a2e&color=f59e0b` }} />
                      <div>
                        <p className="font-medium text-sm">{cel.name}</p>
                        {cel.featured && <span className="text-xs text-gold-400">★ Featured</span>}
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-white/60">{cel.subcategory || cel.category}</td>
                  <td className="p-4 text-sm font-bold text-gold-400">{formatPrice(cel.meetPrice)}</td>
                  <td className="p-4 text-sm text-white/60">{cel.totalBookings}</td>
                  <td className="p-4">
                    <button onClick={() => toggleAvailable(cel.id, cel.available)}
                      className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${cel.available ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                      {cel.available ? <><CheckCircle className="w-3 h-3" /> Available</> : <><XCircle className="w-3 h-3" /> Unavailable</>}
                    </button>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 justify-end">
                      <button onClick={() => openEdit(cel)} className="p-2 rounded-lg hover:bg-white/5 text-white/60 hover:text-gold-400 transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(cel.id, cel.name)} className="p-2 rounded-lg hover:bg-red-500/10 text-white/60 hover:text-red-400 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h2 className="font-display text-xl font-bold">{editing ? 'Edit' : 'Add'} Celebrity</h2>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-white/5"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs text-white/60 mb-1">Name *</label><input value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} className="w-full input-dark rounded-xl px-3 py-2.5 text-sm" required /></div>
                <div><label className="block text-xs text-white/60 mb-1">Category *</label>
                  <select value={form.category} onChange={e => setForm(p => ({...p, category: e.target.value}))} className="w-full input-dark rounded-xl px-3 py-2.5 text-sm" required>
                    <option value="">Select...</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs text-white/60 mb-1">Subcategory</label><input value={form.subcategory} onChange={e => setForm(p => ({...p, subcategory: e.target.value}))} className="w-full input-dark rounded-xl px-3 py-2.5 text-sm" /></div>
                <div><label className="block text-xs text-white/60 mb-1">Nationality</label><input value={form.nationality} onChange={e => setForm(p => ({...p, nationality: e.target.value}))} className="w-full input-dark rounded-xl px-3 py-2.5 text-sm" /></div>
              </div>
              <div><label className="block text-xs text-white/60 mb-1">Bio *</label><textarea value={form.bio} onChange={e => setForm(p => ({...p, bio: e.target.value}))} rows={3} className="w-full input-dark rounded-xl px-3 py-2.5 text-sm resize-none" required /></div>
              <div><label className="block text-xs text-white/60 mb-1">Image URL</label><input value={form.imageUrl} onChange={e => setForm(p => ({...p, imageUrl: e.target.value}))} placeholder="https://..." className="w-full input-dark rounded-xl px-3 py-2.5 text-sm" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs text-white/60 mb-1">Meet & Greet Price ($) *</label><input type="number" value={form.meetPrice} onChange={e => setForm(p => ({...p, meetPrice: e.target.value}))} className="w-full input-dark rounded-xl px-3 py-2.5 text-sm" required /></div>
                <div><label className="block text-xs text-white/60 mb-1">Virtual Price ($)</label><input type="number" value={form.virtualPrice} onChange={e => setForm(p => ({...p, virtualPrice: e.target.value}))} className="w-full input-dark rounded-xl px-3 py-2.5 text-sm" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs text-white/60 mb-1">Signing Price ($)</label><input type="number" value={form.signingPrice} onChange={e => setForm(p => ({...p, signingPrice: e.target.value}))} className="w-full input-dark rounded-xl px-3 py-2.5 text-sm" /></div>
                <div><label className="block text-xs text-white/60 mb-1">Fan Card Base Price ($)</label><input type="number" value={form.fanCardPrice} onChange={e => setForm(p => ({...p, fanCardPrice: e.target.value}))} className="w-full input-dark rounded-xl px-3 py-2.5 text-sm" /></div>
              </div>
              <div><label className="block text-xs text-white/60 mb-1">Tags (comma-separated)</label><input value={form.tags} onChange={e => setForm(p => ({...p, tags: e.target.value}))} placeholder="pop,grammy,singer" className="w-full input-dark rounded-xl px-3 py-2.5 text-sm" /></div>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.featured} onChange={e => setForm(p => ({...p, featured: e.target.checked}))} className="rounded" /><span className="text-sm">Featured</span></label>
                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.available} onChange={e => setForm(p => ({...p, available: e.target.checked}))} className="rounded" /><span className="text-sm">Available for booking</span></label>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 rounded-xl border border-white/20 text-sm hover:bg-white/5">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 btn-gold py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {editing ? 'Update Celebrity' : 'Add Celebrity'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
