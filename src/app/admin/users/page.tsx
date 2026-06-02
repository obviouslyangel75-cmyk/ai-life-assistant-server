'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Users, Shield, Loader2, Search } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/admin/users').then(r => r.json()).then(d => { setUsers(d.users || []); setLoading(false) })
  }, [])

  const filtered = users.filter(u => !search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()))

  async function makeAdmin(id: string, name: string) {
    if (!confirm(`Make ${name} an admin?`)) return
    const res = await fetch(`/api/admin/users/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role: 'admin' }) })
    if (res.ok) { setUsers(prev => prev.map(u => u.id === id ? { ...u, role: 'admin' } : u)); toast.success('Role updated') }
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold mb-1">Manage <span className="text-gold-gradient">Users</span></h1>
        <p className="text-white/50 text-sm">{users.length} registered users</p>
      </div>
      <div className="relative max-w-md mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users..." className="w-full input-dark rounded-xl pl-10 pr-4 py-2.5 text-sm" />
      </div>
      {loading ? <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-gold-400" /></div> : (
        <div className="glass-card rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead><tr className="border-b border-white/10">
              <th className="p-4 text-left text-xs text-white/60">User</th>
              <th className="p-4 text-left text-xs text-white/60">Email</th>
              <th className="p-4 text-left text-xs text-white/60">Role</th>
              <th className="p-4 text-left text-xs text-white/60">Joined</th>
              <th className="p-4 text-right text-xs text-white/60">Actions</th>
            </tr></thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id} className="border-b border-white/5 hover:bg-white/2">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-black font-bold text-sm">
                        {u.image ? <Image src={u.image} alt="" width={36} height={36} className="w-full h-full object-cover" /> : u.name?.[0] || 'U'}
                      </div>
                      <span className="text-sm font-medium">{u.name || 'Anonymous'}</span>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-white/60">{u.email}</td>
                  <td className="p-4">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${u.role === 'admin' ? 'bg-gold-500/20 text-gold-400' : 'bg-white/5 text-white/60'}`}>
                      {u.role === 'admin' && <Shield className="w-3 h-3 inline mr-1" />}{u.role}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-white/60">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className="p-4 text-right">
                    {u.role !== 'admin' && (
                      <button onClick={() => makeAdmin(u.id, u.name || 'user')} className="text-xs px-3 py-1 rounded-lg bg-gold-500/10 text-gold-400 hover:bg-gold-500/20">
                        Make Admin
                      </button>
                    )}
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
