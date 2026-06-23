'use client'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { Search, SlidersHorizontal } from 'lucide-react'

interface Props { initialParams: Record<string, string | undefined> }

export function CelebritySearch({ initialParams }: Props) {
  const router = useRouter()
  const [q, setQ] = useState(initialParams.q || '')
  const [sort, setSort] = useState(initialParams.sort || '')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (sort) params.set('sort', sort)
    if (initialParams.category) params.set('category', initialParams.category)
    router.push(`/celebrities?${params.toString()}`)
  }

  return (
    <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
        <input
          type="search"
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Search celebrities by name, category, nationality..."
          className="w-full input-dark rounded-xl pl-11 pr-4 py-3.5 text-sm"
        />
      </div>
      <select
        value={sort}
        onChange={e => setSort(e.target.value)}
        className="input-dark rounded-xl px-4 py-3.5 text-sm sm:w-48 appearance-none">
        <option value="">Sort: Featured</option>
        <option value="rating">Highest Rated</option>
        <option value="price_asc">Price: Low to High</option>
        <option value="price_desc">Price: High to Low</option>
        <option value="bookings">Most Booked</option>
      </select>
      <button type="submit" className="btn-gold px-6 py-3.5 rounded-xl font-semibold text-sm shrink-0">
        Search
      </button>
    </form>
  )
}
