import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Ticket System POC',
  description: 'OOAD Challenge — 10 patterns in a ticket system',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <nav className="border-b border-gray-200 bg-white px-6 py-3 flex items-center justify-between">
            <Link href="/" className="font-bold text-gray-900 text-lg">Ticket System POC</Link>
            <div className="flex gap-4 text-sm">
              <Link href="/" className="text-gray-600 hover:text-gray-900">Shows</Link>
              <Link href="/cart" className="text-gray-600 hover:text-gray-900">Cart</Link>
            </div>
          </nav>
          <main className="min-h-screen bg-gray-50">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  )
}
