import Link from 'next/link'
import { Star, Sparkles, Users, Award, Globe, ArrowRight, ChevronRight, Zap, Shield, Heart } from 'lucide-react'
import { CelebrityImage } from '@/components/CelebrityImage'
import { prisma } from '@/lib/db'
import { formatPrice } from '@/lib/utils'

async function getFeaturedCelebrities() {
  try {
    return await prisma.celebrity.findMany({
      where: { featured: true, available: true },
      take: 8,
      orderBy: { rating: 'desc' },
    })
  } catch { return [] }
}

async function getStats() {
  try {
    const [celebs, bookings, users] = await Promise.all([
      prisma.celebrity.count(),
      prisma.booking.count(),
      prisma.user.count({ where: { role: 'fan' } }),
    ])
    return { celebs, bookings, users }
  } catch { return { celebs: 2000000, bookings: 48700, users: 312000 } }
}

const CATEGORIES = [
  { name: 'Music', icon: '🎵', color: 'from-purple-600 to-pink-600', count: '850K+' },
  { name: 'Film & TV', icon: '🎬', color: 'from-blue-600 to-cyan-600', count: '420K+' },
  { name: 'Sports', icon: '⚽', color: 'from-green-600 to-emerald-600', count: '380K+' },
  { name: 'Social Media', icon: '📱', color: 'from-pink-600 to-rose-600', count: '290K+' },
  { name: 'Business & Tech', icon: '💼', color: 'from-amber-600 to-orange-600', count: '120K+' },
  { name: 'Comedy', icon: '😂', color: 'from-yellow-500 to-amber-600', count: '95K+' },
]

const HOW_IT_WORKS = [
  { step: '01', title: 'Browse Celebrities', desc: 'Explore our curated database of 2M+ celebrities from music, sports, film, and more.', icon: Globe },
  { step: '02', title: 'Choose Your Experience', desc: 'Select from in-person meet & greets, virtual calls, autograph signings, or fan cards.', icon: Sparkles },
  { step: '03', title: 'Book & Pay', desc: 'Secure your spot with our safe payment system. Receive instant confirmation.', icon: Shield },
  { step: '04', title: 'Meet Your Star', desc: 'Show up and experience the moment of a lifetime with your favorite celebrity.', icon: Star },
]

const TESTIMONIALS = [
  { name: 'Jessica M.', role: 'Swiftie since 2008', text: 'Meeting Taylor Swift was a dream come true. StarConnect made the entire process so smooth and professional. I still can\'t believe it happened!', rating: 5, avatar: 'JM' },
  { name: 'Marcus T.', role: 'Sports Fan', text: 'Got an in-person meet and greet with LeBron James. He was incredibly warm and genuine. Worth every penny. Already booking again!', rating: 5, avatar: 'MT' },
  { name: 'Priya K.', role: 'Entertainment Blogger', text: 'The virtual call with Shah Rukh Khan was absolutely incredible. StarConnect Pro\'s service is impeccable. This is the future of fan experiences.', rating: 5, avatar: 'PK' },
]

export default async function Home() {
  const [featured, stats] = await Promise.all([getFeaturedCelebrities(), getStats()])

  return (
    <div className="star-bg">
      {/* ── HERO ── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
        {/* Animated background orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-1/2 -right-40 w-96 h-96 bg-gold-500/15 rounded-full blur-3xl animate-pulse" style={{animationDelay:'1s'}} />
          <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-blue-600/15 rounded-full blur-3xl animate-pulse" style={{animationDelay:'2s'}} />
          {/* Star particles */}
          {Array.from({ length: 50 }).map((_, i) => (
            <div key={i} className="star-particle" style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              '--d': `${2 + Math.random() * 4}s`,
              animationDelay: `${Math.random() * 3}s`,
              opacity: Math.random() * 0.5 + 0.1,
            } as any} />
          ))}
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-20">
          <div className="inline-flex items-center gap-2 bg-gold-500/10 border border-gold-500/30 rounded-full px-4 py-2 mb-8 text-sm text-gold-400">
            <Sparkles className="w-4 h-4" />
            <span>World&apos;s #1 Celebrity Booking Platform</span>
            <span className="bg-gold-500 text-black text-xs px-2 py-0.5 rounded-full font-bold ml-1">NEW</span>
          </div>

          <h1 className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold leading-tight mb-6">
            Meet Your{' '}
            <span className="text-gold-gradient block sm:inline">Favorite Stars</span>
          </h1>

          <p className="text-white/60 text-lg sm:text-xl max-w-3xl mx-auto mb-10 leading-relaxed">
            Exclusive celebrity meet & greets, virtual experiences, fan cards, and autograph signings.
            Access <strong className="text-gold-400">2M+ celebrities</strong> across music, sports, film, and beyond.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link href="/celebrities" className="btn-gold flex items-center gap-2 px-8 py-4 rounded-full text-lg font-bold shadow-gold-lg">
              <Star className="w-5 h-5 fill-current" />
              Explore Celebrities
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/fan-cards" className="flex items-center gap-2 px-8 py-4 rounded-full border border-white/20 hover:border-gold-500/40 text-white hover:text-gold-400 transition-all text-lg font-medium">
              <Heart className="w-5 h-5" />
              Get Fan Cards
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 sm:gap-8 max-w-2xl mx-auto">
            {[
              { value: '2M+', label: 'Celebrities', icon: '⭐' },
              { value: stats.bookings > 1000 ? `${(stats.bookings/1000).toFixed(0)}K+` : `${stats.bookings}+`, label: 'Bookings Made', icon: '📅' },
              { value: stats.users > 1000 ? `${(stats.users/1000).toFixed(0)}K+` : `${stats.users}+`, label: 'Happy Fans', icon: '❤️' },
            ].map(stat => (
              <div key={stat.label} className="glass-card rounded-2xl p-4 sm:p-6">
                <div className="text-3xl sm:text-4xl font-display font-bold text-gold-gradient">{stat.value}</div>
                <div className="text-white/50 text-sm mt-1">{stat.icon} {stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/30 text-xs animate-bounce">
          <span>Scroll to explore</span>
          <div className="w-px h-8 bg-gradient-to-b from-white/30 to-transparent" />
        </div>
      </section>

      {/* ── FEATURED CELEBRITIES ── */}
      {featured.length > 0 && (
        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="text-gold-400 text-sm font-medium uppercase tracking-wider mb-2">Hand-picked for you</p>
              <h2 className="font-display text-4xl font-bold">Featured <span className="text-gold-gradient">Stars</span></h2>
            </div>
            <Link href="/celebrities?featured=1" className="hidden sm:flex items-center gap-2 text-gold-400 hover:text-gold-300 transition-colors text-sm font-medium">
              View All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
            {featured.map(cel => (
              <Link key={cel.id} href={`/celebrities/${cel.slug}`} className="celebrity-card glass-card glass-card-hover rounded-2xl overflow-hidden group block">
                <div className="relative aspect-square overflow-hidden">
                  <CelebrityImage src={cel.imageUrl} alt={cel.name} fallbackName={cel.name} fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  {cel.verified && (
                    <div className="absolute top-3 right-3 badge-verified flex items-center gap-1">
                      <Star className="w-3 h-3 fill-current" /> Verified
                    </div>
                  )}
                  <div className="absolute bottom-3 left-3">
                    <p className="font-bold text-white text-sm">{cel.name}</p>
                    <p className="text-white/60 text-xs">{cel.subcategory || cel.category}</p>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-gold-400 fill-current" />
                      <span className="text-sm font-medium">{cel.rating.toFixed(1)}</span>
                      <span className="text-white/40 text-xs">({cel.reviewCount.toLocaleString()})</span>
                    </div>
                    <span className="text-xs text-white/40">{cel.nationality}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-white/40">Meet & Greet from</p>
                      <p className="font-bold text-gold-400 text-sm">{formatPrice(cel.meetPrice)}</p>
                    </div>
                    <span className="text-xs bg-white/5 text-white/60 px-2 py-1 rounded-full">{cel.category}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link href="/celebrities" className="inline-flex items-center gap-2 btn-gold px-8 py-3 rounded-full font-semibold">
              Browse All 2M+ Celebrities <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      )}

      {/* ── CATEGORIES ── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-gold-400 text-sm font-medium uppercase tracking-wider mb-2">Find your idol</p>
          <h2 className="font-display text-4xl font-bold">Browse by <span className="text-gold-gradient">Category</span></h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {CATEGORIES.map(cat => (
            <Link key={cat.name} href={`/celebrities?category=${encodeURIComponent(cat.name)}`}
              className="group glass-card glass-card-hover rounded-2xl p-6 text-center">
              <div className={`w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${cat.color} flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform`}>
                {cat.icon}
              </div>
              <p className="font-semibold text-sm mb-1">{cat.name}</p>
              <p className="text-white/40 text-xs">{cat.count} stars</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-gold-400 text-sm font-medium uppercase tracking-wider mb-2">Simple & seamless</p>
            <h2 className="font-display text-4xl font-bold">How <span className="text-gold-gradient">StarConnect</span> Works</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {HOW_IT_WORKS.map((step, i) => (
              <div key={step.step} className="relative">
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden lg:block absolute top-10 left-full w-full h-px bg-gradient-to-r from-gold-500/30 to-transparent z-0" />
                )}
                <div className="glass-card rounded-2xl p-8 text-center relative z-10">
                  <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-gold-500/20 to-gold-600/10 border border-gold-500/30 flex items-center justify-center">
                    <step.icon className="w-7 h-7 text-gold-400" />
                  </div>
                  <span className="font-display text-5xl font-bold text-gold-500/20 block mb-2">{step.step}</span>
                  <h3 className="font-bold text-lg mb-3">{step.title}</h3>
                  <p className="text-white/50 text-sm leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAN CARDS CTA ── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="rounded-3xl overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/80 via-gold-900/40 to-pink-900/60" />
          <div className="absolute inset-0" style={{backgroundImage: 'url(https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1400)', backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.15}} />
          <div className="relative z-10 p-12 lg:p-20 flex flex-col lg:flex-row items-center justify-between gap-10">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-gold-500/20 text-gold-400 rounded-full px-4 py-1.5 text-sm mb-6">
                <Zap className="w-4 h-4" /> Exclusive Digital Collectibles
              </div>
              <h2 className="font-display text-4xl lg:text-5xl font-bold mb-4">
                Collect Official<br /><span className="text-gold-gradient">Fan Cards</span>
              </h2>
              <p className="text-white/60 text-lg max-w-lg leading-relaxed">
                Own exclusive digital fan cards from your favorite celebrities. Bronze, Silver, Gold, and Platinum tiers with unique perks and discounts.
              </p>
            </div>
            <div className="flex flex-col items-center gap-4">
              <div className="flex gap-3">
                {[{tier: 'Bronze', color: '#cd7f32'}, {tier: 'Silver', color: '#c0c0c0'}, {tier: 'Gold', color: '#FFD700'}, {tier: 'Platinum', color: '#E5E4E2'}].map(({tier, color}) => (
                  <div key={tier} className="w-16 h-24 rounded-xl glass-card flex flex-col items-center justify-center gap-1 border" style={{borderColor: color + '40'}}>
                    <Star className="w-5 h-5" style={{color}} fill="currentColor" />
                    <span className="text-xs font-bold" style={{color}}>{tier}</span>
                  </div>
                ))}
              </div>
              <Link href="/fan-cards" className="btn-gold flex items-center gap-2 px-8 py-4 rounded-full font-bold text-lg">
                <Heart className="w-5 h-5" /> Get Fan Cards
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-gold-400 text-sm font-medium uppercase tracking-wider mb-2">Real fan stories</p>
          <h2 className="font-display text-4xl font-bold">What <span className="text-gold-gradient">Fans Say</span></h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map(t => (
            <div key={t.name} className="glass-card rounded-2xl p-8">
              <div className="flex gap-1 mb-4">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-gold-400 fill-current" />
                ))}
              </div>
              <p className="text-white/70 leading-relaxed mb-6 italic">"{t.text}"</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-black font-bold text-sm">
                  {t.avatar}
                </div>
                <div>
                  <p className="font-semibold text-sm">{t.name}</p>
                  <p className="text-white/40 text-xs">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="w-20 h-20 mx-auto mb-8 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center shadow-gold-lg">
            <Star className="w-10 h-10 text-black fill-current" />
          </div>
          <h2 className="font-display text-4xl sm:text-5xl font-bold mb-6">
            Your Dream Meeting<br /><span className="text-gold-gradient">Awaits You</span>
          </h2>
          <p className="text-white/50 text-lg mb-10">Join 312,000+ fans who have already made unforgettable memories with their favorite stars.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/celebrities" className="btn-gold flex items-center gap-2 px-10 py-4 rounded-full font-bold text-lg shadow-gold-lg">
              Start Exploring <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/login?signup=1" className="flex items-center gap-2 px-10 py-4 rounded-full border border-white/20 hover:border-gold-500/40 transition-colors text-lg font-medium">
              Create Free Account
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
