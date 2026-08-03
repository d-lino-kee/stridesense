import type { Metadata } from 'next'
import { Plus_Jakarta_Sans, Bricolage_Grotesque } from 'next/font/google'
import './globals.css'
import Providers from '@/providers'
import NavBar from './components/NavBar'
import Footer from './components/Footer'
import ApiStatusBanner from './components/ApiStatusBanner'

// Warmer, more humanist type: Plus Jakarta Sans for body, Bricolage Grotesque
// (a slightly organic grotesque) for headings.
const sans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})
const display = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'StrideSense — Personalized running recommendations',
  description:
    'A multi-framework running recommendation platform. Strava + Google Maps data feed a scikit-learn model that predicts route suitability and recommends personalized runs.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${display.variable}`}>
      <body className="flex min-h-screen flex-col font-sans">
        <Providers>
          <NavBar />
          <main className="flex-1">{children}</main>
          <Footer />
          <ApiStatusBanner />
        </Providers>
      </body>
    </html>
  )
}
