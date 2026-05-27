import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import Link from 'next/link'
import './globals.css'
import { Providers } from './providers'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Guitar Factory System',
  description: 'OOAD Challenge — Custom Guitar Builder',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 min-h-screen`}>
        <Providers>
          <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-6">
            <Link href="/" className="font-bold text-gray-900 text-lg">🎸 Guitar Factory</Link>
            <Link href="/configurator" className="text-sm text-gray-600 hover:text-amber-600 font-medium">Configurator</Link>
            <Link href="/inventory" className="text-sm text-gray-600 hover:text-amber-600 font-medium">Inventory</Link>
          </nav>
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  )
}
