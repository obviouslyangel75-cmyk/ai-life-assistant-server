import { notFound } from 'next/navigation'
import Link from 'next/link'
import { CelebrityImage } from '@/components/CelebrityImage'
import { Star, Globe, Instagram, Twitter, Youtube, Calendar, Clock, Users, Award, ArrowLeft, Heart, Share2, CheckCircle } from 'lucide-react'
import { prisma } from '@/lib/db'
import { formatPrice, BOOKING_TYPES, FAN_CARD_TIERS } from '@/lib/utils'
import { BookingSection } from '@/components/BookingSection'

interface Props { params: { id: string } }

async function getCelebrity(slug: string) {
  try {
    return await prisma.celebrity.findUnique({
      where: { slug },
      include: { reviews: { include: { user: true }, take: 6, orderBy: { createdAt: 'desc' } } },
    })
  } catch { return null }
}

export async function generateMetadata({ params }: Props) {
  const cel = await getCelebrity(params.id)
  if (!cel) return { title: 'Celebrity Not Found' }
  return {
    title: `${cel.name} — Book a Meet & Greet`,
    description: cel.bio,
  }
}

export default async function CelebrityPage({ params }: Props) {
  const cel = await getCelebrity(params.id)
  if (!cel) notFound()

  const experiences = [
    { type: 'meet-greet', label: 'In-Person Meet & Greet', price: cel.meetPrice, icon: '🤝', duration: 30, desc: 'Exclusive in-person meeting, photo opportunity, and personal interaction.' },
    { type: 'virtual', label: 'Virtual Video Call', price: cel.virtualPrice || cel.meetPrice * 0.3, icon: '💻', duration: 15, desc: 'One-on-one video call from the comfort of your home.' },
    { type: 'signing', label: 'Autograph Signing', price: cel.signingPrice || cel.meetPrice * 0.2, icon: '✍️', duration: 10, desc: 'Official autograph on your item, certificate of authenticity included.' },
  ]

  return (
    <div className="min-h-screen star-bg pt-20">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <CelebrityImage src={cel.imageUrl} alt={cel.name} fallbackName={cel.name} fill className="object-cover object-top blur-xl scale-110" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-navy-900/80 via-navy-900/60 to-navy-900" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Link href="/celebrities" className="inline-flex items-center gap-2 text-white/60 hover:text-gold-400 transition-colors mb-8 text-sm">
            <ArrowLeft className="w-4 h-4" /> Back to Celebrities
          </Link>

          <div className="flex flex-col lg:flex-row gap-10">
            {/* Photo */}
            <div className="lg:w-80 xl:w-96 shrink-0">
              <div className="relative rounded-3xl overflow-hidden aspect-[3/4] shadow-2xl border border-white/10">
                <CelebrityImage src={cel.imageUrl} alt={cel.name} fallbackName={cel.name} fill className="object-cover" />
                {cel.verified && (
                  <div className="absolute top-4 right-4 flex items-center gap-1 bg-gold-500 text-black text-xs font-bold px-3 py-1.5 rounded-full">
                    <CheckCircle className="w-3.5 h-3.5" /> Verified Star
                  </div>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <p className="text-gold-400 text-sm font-medium mb-1">{cel.subcategory || cel.category}</p>
                  <h1 className="font-display text-4xl lg:text-5xl font-bold mb-2">{cel.name}</h1>
                  <div className="flex items-center gap-3 text-sm text-white/60">
                    {cel.nationality && <span className="flex items-center gap-1"><Globe className="w-4 h-4" /> {cel.nationality}</span>}
                    {cel.birthYear && <span>Born {cel.birthYear}</span>}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/10">
                    <Heart className="w-5 h-5" />
                  </button>
                  <button className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/10">
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center gap-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`w-5 h-5 ${i < Math.round(cel.rating) ? 'text-gold-400 fill-current' : 'text-white/20'}`} />
                  ))}
                  <span className="font-bold">{cel.rating.toFixed(1)}</span>
                </div>
                <span className="text-white/50 text-sm">({cel.reviewCount.toLocaleString()} reviews)</span>
                <span className="text-white/50 text-sm">{cel.totalBookings.toLocaleString()} bookings</span>
              </div>

              {/* Bio */}
              <p className="text-white/70 leading-relaxed mb-6 text-lg">{cel.bio}</p>
              {cel.longBio && cel.longBio !== cel.bio && <p className="text-white/50 leading-relaxed mb-6">{cel.longBio}</p>}

              {/* Tags */}
              {cel.tags && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {cel.tags.split(',').map((tag: string) => (
                    <span key={tag} className="px-3 py-1 bg-white/5 text-white/60 rounded-full text-sm border border-white/10">
                      #{tag.trim()}
                    </span>
                  ))}
                </div>
              )}

              {/* Social */}
              <div className="flex gap-3">
                {cel.instagram && <a href={`https://instagram.com/${cel.instagram.replace('@','')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"><Instagram className="w-4 h-4" /> Instagram</a>}
                {cel.twitter && <a href={`https://twitter.com/${cel.twitter.replace('@','')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-black px-4 py-2 rounded-xl text-sm font-medium border border-white/20 hover:bg-white/5 transition-colors"><Twitter className="w-4 h-4" /> Twitter/X</a>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Booking section */}
          <div className="lg:col-span-2">
            <BookingSection celebrity={cel} experiences={experiences} />

            {/* Fan Cards */}
            <div className="mt-10">
              <h2 className="font-display text-2xl font-bold mb-6">
                Official <span className="text-gold-gradient">Fan Cards</span>
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {FAN_CARD_TIERS.map(tier => (
                  <Link key={tier.value} href={`/fan-cards?celebrity=${cel.id}&tier=${tier.value}`}
                    className="glass-card glass-card-hover rounded-2xl p-5 text-center group">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center" style={{background: `${tier.color}20`, border: `1px solid ${tier.color}40`}}>
                      <Star className="w-6 h-6 fill-current" style={{color: tier.color}} />
                    </div>
                    <p className="font-bold text-sm mb-1" style={{color: tier.color}}>{tier.label}</p>
                    <p className="font-bold text-gold-400">{formatPrice(cel.fanCardPrice * tier.multiplier)}</p>
                    <ul className="mt-3 space-y-1">
                      {tier.perks.slice(0, 2).map(perk => (
                        <li key={perk} className="text-xs text-white/40">{perk}</li>
                      ))}
                    </ul>
                  </Link>
                ))}
              </div>
            </div>

            {/* Reviews */}
            {cel.reviews.length > 0 && (
              <div className="mt-10">
                <h2 className="font-display text-2xl font-bold mb-6">Fan <span className="text-gold-gradient">Reviews</span></h2>
                <div className="space-y-4">
                  {cel.reviews.map((review: any) => (
                    <div key={review.id} className="glass-card rounded-2xl p-6">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-black font-bold text-sm">
                            {review.user.name?.[0] || 'F'}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{review.user.name || 'Fan'}</p>
                            <p className="text-white/40 text-xs">{new Date(review.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          {Array.from({ length: review.rating }).map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 text-gold-400 fill-current" />
                          ))}
                        </div>
                      </div>
                      {review.title && <p className="font-semibold mb-2">{review.title}</p>}
                      <p className="text-white/60 text-sm">{review.body}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick stats */}
            <div className="glass-card rounded-2xl p-6">
              <h3 className="font-bold mb-4 text-gold-400">Quick Info</h3>
              <div className="space-y-4">
                {[
                  { icon: Star, label: 'Rating', value: `${cel.rating.toFixed(1)} / 5.0` },
                  { icon: Users, label: 'Bookings', value: cel.totalBookings.toLocaleString() },
                  { icon: Award, label: 'Category', value: cel.category },
                  { icon: Globe, label: 'Nationality', value: cel.nationality || 'International' },
                  { icon: Calendar, label: 'Available', value: cel.available ? 'Yes — Book Now' : 'Currently Unavailable' },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between py-2 border-b border-white/10 last:border-0">
                    <div className="flex items-center gap-2 text-white/50 text-sm">
                      <item.icon className="w-4 h-4 text-gold-400" />
                      {item.label}
                    </div>
                    <span className="text-sm font-medium">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Price summary */}
            <div className="glass-card rounded-2xl p-6 border border-gold-500/20">
              <h3 className="font-bold mb-4">Pricing</h3>
              <div className="space-y-3">
                {experiences.map(exp => (
                  <div key={exp.type} className="flex items-center justify-between">
                    <span className="text-sm text-white/60">{exp.icon} {exp.label}</span>
                    <span className="font-bold text-gold-400">{formatPrice(exp.price)}</span>
                  </div>
                ))}
                <div className="pt-3 border-t border-white/10">
                  <p className="text-xs text-white/40">Fan Cards from</p>
                  <p className="font-bold text-gold-400">{formatPrice(cel.fanCardPrice)} / card</p>
                </div>
              </div>
            </div>

            {/* Safety */}
            <div className="glass-card rounded-2xl p-6">
              <h3 className="font-bold mb-3 text-sm text-white/60 uppercase tracking-wider">Why StarConnect?</h3>
              <ul className="space-y-3">
                {['100% Verified celebrities', 'Secure payment processing', 'Full refund if cancelled', '24/7 concierge support', 'AI-powered booking agent'].map(item => (
                  <li key={item} className="flex items-center gap-3 text-sm text-white/70">
                    <CheckCircle className="w-4 h-4 text-gold-400 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
