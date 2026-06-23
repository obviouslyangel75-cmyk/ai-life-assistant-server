import Link from 'next/link'
import { Star, Instagram, Twitter, Youtube, Mail, Phone, MapPin } from 'lucide-react'

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-navy-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-gold rounded-lg flex items-center justify-center">
                <Star className="w-5 h-5 text-black fill-current" />
              </div>
              <span className="font-display font-bold text-xl text-gold-gradient">StarConnect<sup className="text-xs ml-0.5">PRO</sup></span>
            </Link>
            <p className="text-white/50 text-sm leading-relaxed mb-6">Where every fan meets their star. Exclusive celebrity experiences, fan cards, and unforgettable memories worldwide.</p>
            <div className="flex gap-4">
              {[Instagram, Twitter, Youtube].map((Icon, i) => (
                <a key={i} href="#" className="w-9 h-9 rounded-full bg-white/5 hover:bg-gold-500/20 hover:text-gold-400 flex items-center justify-center transition-all border border-white/10 hover:border-gold-500/40">
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Explore */}
          <div>
            <h3 className="font-semibold text-gold-400 mb-4 text-sm uppercase tracking-wider">Explore</h3>
            <ul className="space-y-3">
              {[
                ['Celebrities', '/celebrities'],
                ['Fan Cards', '/fan-cards'],
                ['Music Stars', '/celebrities?category=Music'],
                ['Sports Icons', '/celebrities?category=Sports'],
                ['Film & TV', '/celebrities?category=Film+%26+TV'],
                ['Business Leaders', '/celebrities?category=Business+%26+Tech'],
              ].map(([label, href]) => (
                <li key={href}>
                  <Link href={href} className="text-white/50 hover:text-gold-400 text-sm transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold text-gold-400 mb-4 text-sm uppercase tracking-wider">Company</h3>
            <ul className="space-y-3">
              {[
                ['About Us', '/about'],
                ['How It Works', '/#how-it-works'],
                ['Pricing', '/#pricing'],
                ['Celebrity Partners', '/celebrities'],
                ['Careers', '/careers'],
                ['Press', '/press'],
              ].map(([label, href]) => (
                <li key={href}>
                  <Link href={href} className="text-white/50 hover:text-gold-400 text-sm transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-gold-400 mb-4 text-sm uppercase tracking-wider">Contact</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-white/50 text-sm">
                <Mail className="w-4 h-4 text-gold-400 shrink-0" />
                <a href="mailto:management.team@mail.com" className="hover:text-gold-400 transition-colors">management.team@mail.com</a>
              </li>
              <li className="flex items-center gap-3 text-white/50 text-sm">
                <Phone className="w-4 h-4 text-gold-400 shrink-0" />
                <span>+1 (800) STAR-CON</span>
              </li>
              <li className="flex items-start gap-3 text-white/50 text-sm">
                <MapPin className="w-4 h-4 text-gold-400 shrink-0 mt-0.5" />
                <span>Beverly Hills, CA 90210<br />Los Angeles, United States</span>
              </li>
            </ul>
            <div className="mt-6 p-4 rounded-xl bg-gold-500/10 border border-gold-500/20">
              <p className="text-xs text-white/50 mb-1">24/7 VIP Concierge</p>
              <p className="text-sm font-medium text-gold-400">Available for Premium Members</p>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-white/30 text-sm">© 2026 StarConnect Pro. All rights reserved.</p>
          <div className="flex gap-6 text-xs text-white/30">
            {['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'Refund Policy'].map(label => (
              <Link key={label} href="#" className="hover:text-gold-400 transition-colors">{label}</Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
