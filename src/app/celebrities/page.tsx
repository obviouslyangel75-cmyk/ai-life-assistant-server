import { Suspense } from 'react'
import Link from 'next/link'
import { Star, Search, Filter, Globe, Award } from 'lucide-react'
import { CelebrityImage } from '@/components/CelebrityImage'
import { prisma } from '@/lib/db'
import { formatPrice, CATEGORIES } from '@/lib/utils'
import { CelebritySearch } from '@/components/CelebritySearch'

interface PageProps {
  searchParams: { q?: string; category?: string; minPrice?: string; maxPrice?: string; sort?: string; featured?: string; page?: string }
}

async function getCelebrities(params: PageProps['searchParams']) {
  const page = parseInt(params.page || '1')
  const limit = 24
  const skip = (page - 1) * limit

  const where: any = { available: true }
  if (params.q) {
    where.OR = [
      { name: { contains: params.q, mode: 'insensitive' } },
      { bio: { contains: params.q, mode: 'insensitive' } },
      { category: { contains: params.q, mode: 'insensitive' } },
      { subcategory: { contains: params.q, mode: 'insensitive' } },
      { tags: { contains: params.q, mode: 'insensitive' } },
      { nationality: { contains: params.q, mode: 'insensitive' } },
    ]
  }
  if (params.category) where.category = params.category
  if (params.featured === '1') where.featured = true
  if (params.minPrice) where.meetPrice = { ...where.meetPrice, gte: parseFloat(params.minPrice) }
  if (params.maxPrice) where.meetPrice = { ...where.meetPrice, lte: parseFloat(params.maxPrice) }

  const orderBy: any = params.sort === 'price_asc' ? { meetPrice: 'asc' }
    : params.sort === 'price_desc' ? { meetPrice: 'desc' }
    : params.sort === 'rating' ? { rating: 'desc' }
    : params.sort === 'bookings' ? { totalBookings: 'desc' }
    : { featured: 'desc' }

  try {
    const [celebs, total] = await Promise.all([
      prisma.celebrity.findMany({ where, orderBy, skip, take: limit }),
      prisma.celebrity.count({ where }),
    ])
    return { celebs, total, pages: Math.ceil(total / limit), page }
  } catch {
    return { celebs: [], total: 0, pages: 1, page: 1 }
  }
}

export default async function CelebritiesPage({ searchParams }: PageProps) {
  const { celebs, total, pages, page } = await getCelebrities(searchParams)

  return (
    <div className="min-h-screen star-bg pt-20">
      {/* Header */}
      <div className="relative border-b border-white/10 bg-navy-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="font-display text-4xl lg:text-5xl font-bold mb-2">
            {searchParams.category || 'All'} <span className="text-gold-gradient">Celebrities</span>
          </h1>
          <p className="text-white/50 mb-8">
            {total.toLocaleString()} {searchParams.category ? `${searchParams.category} stars` : 'celebrities'} available for booking
          </p>

          <CelebritySearch initialParams={searchParams} />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-8 no-scrollbar">
          <Link href="/celebrities"
            className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${!searchParams.category ? 'bg-gold-500 text-black' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}>
            All
          </Link>
          {CATEGORIES.map(cat => (
            <Link key={cat} href={`/celebrities?category=${encodeURIComponent(cat)}`}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${searchParams.category === cat ? 'bg-gold-500 text-black' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}>
              {cat}
            </Link>
          ))}
        </div>

        {celebs.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="font-display text-2xl font-bold mb-2">No celebrities found</h3>
            <p className="text-white/50">Try adjusting your search or filters</p>
            <Link href="/celebrities" className="btn-gold inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold mt-6">
              Clear Filters
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4 lg:gap-6">
            {celebs.map(cel => (
              <Link key={cel.id} href={`/celebrities/${cel.slug}`} className="celebrity-card glass-card glass-card-hover rounded-2xl overflow-hidden group block">
                <div className="relative aspect-square overflow-hidden">
                  <CelebrityImage src={cel.imageUrl} alt={cel.name} fallbackName={cel.name} fill className="object-cover group-hover:scale-110 transition-transform duration-500"
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                  {cel.verified && (
                    <div className="absolute top-2 right-2 badge-verified flex items-center gap-1 text-xs">
                      <Star className="w-2.5 h-2.5 fill-current" /> Verified
                    </div>
                  )}
                  {cel.featured && (
                    <div className="absolute top-2 left-2 bg-purple-600 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                      ★ Featured
                    </div>
                  )}
                  <div className="absolute bottom-2 left-3 right-3">
                    <p className="font-bold text-white text-sm truncate">{cel.name}</p>
                    <p className="text-white/60 text-xs truncate">{cel.subcategory || cel.category}</p>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-gold-400 fill-current" />
                      <span className="text-xs font-medium">{cel.rating.toFixed(1)}</span>
                      <span className="text-white/30 text-xs">({cel.reviewCount > 999 ? `${(cel.reviewCount/1000).toFixed(0)}K` : cel.reviewCount})</span>
                    </div>
                    {cel.nationality && <span className="text-white/30 text-xs truncate max-w-[80px]">{cel.nationality}</span>}
                  </div>
                  <div className="pt-2 border-t border-white/10">
                    <p className="text-xs text-white/40">From</p>
                    <p className="font-bold text-gold-400">{formatPrice(cel.meetPrice)}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-12">
            {page > 1 && (
              <Link href={`/celebrities?${new URLSearchParams({ ...searchParams, page: String(page - 1) })}`}
                className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-sm">← Prev</Link>
            )}
            {Array.from({ length: Math.min(pages, 7) }).map((_, i) => {
              const p = i + 1
              return (
                <Link key={p} href={`/celebrities?${new URLSearchParams({ ...searchParams, page: String(p) })}`}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-medium transition-colors ${page === p ? 'bg-gold-500 text-black' : 'bg-white/5 hover:bg-white/10'}`}>
                  {p}
                </Link>
              )
            })}
            {page < pages && (
              <Link href={`/celebrities?${new URLSearchParams({ ...searchParams, page: String(page + 1) })}`}
                className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-sm">Next →</Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
