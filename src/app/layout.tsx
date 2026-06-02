import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { Toaster } from 'react-hot-toast'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair', display: 'swap' })

export const metadata: Metadata = {
  title: { default: 'StarConnect Pro — Where Every Fan Meets Their Star', template: '%s | StarConnect Pro' },
  description: 'Book exclusive meet & greet experiences with your favorite celebrities. Purchase fan cards, virtual meetings, and autograph signings. Access 2M+ celebrities worldwide.',
  keywords: ['celebrity booking', 'meet and greet', 'fan experience', 'celebrity fan cards', 'virtual celebrity meeting'],
  authors: [{ name: 'StarConnect Pro' }],
  openGraph: {
    title: 'StarConnect Pro — Where Every Fan Meets Their Star',
    description: 'Book exclusive celebrity experiences. 2M+ celebrities worldwide.',
    type: 'website',
  },
  icons: { icon: '/favicon.ico' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="bg-navy-900 text-white antialiased">
        <Providers>
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
          <Toaster
            position="top-right"
            toastOptions={{
              style: { background: '#0f172a', color: '#fff', border: '1px solid rgba(245,158,11,0.3)' },
              success: { iconTheme: { primary: '#f59e0b', secondary: '#000' } },
            }}
          />
        </Providers>
      </body>
    </html>
  )
}
