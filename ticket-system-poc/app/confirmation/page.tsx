'use client'
import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense, useState, useEffect } from 'react'
import Link from 'next/link'
import type { Ticket } from '@/domain/types'

function ConfirmationContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const ticketIds = searchParams.get('tickets')?.split(',').filter(Boolean) ?? []

  const [tickets, setTickets] = useState<Ticket[]>([])
  const [cancelling, setCancelling] = useState(false)
  const [cancelled, setCancelled] = useState(false)

  useEffect(() => {
    // Fetch ticket details from API
    async function loadTickets() {
      if (ticketIds.length === 0) return
      const results: Ticket[] = []
      for (const id of ticketIds) {
        try {
          const res = await fetch(`/api/tickets/${id}`)
          if (res.ok) {
            const data = await res.json()
            results.push(data)
          }
        } catch { /* skip */ }
      }
      setTickets(results)
    }
    loadTickets()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleCancelAll() {
    setCancelling(true)
    for (const id of ticketIds) {
      try {
        await fetch('/api/purchase/cancel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ticketId: id }),
        })
      } catch { /* continue */ }
    }
    setCancelling(false)
    setCancelled(true)
  }

  if (ticketIds.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400">No tickets found.</p>
        <Link href="/" className="text-indigo-600 hover:underline text-sm mt-4 inline-block">Browse Shows</Link>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto py-10 px-4">
      <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6 text-center">
        <div className="text-4xl mb-2">🎟</div>
        <h1 className="text-2xl font-bold text-green-800">
          {cancelled ? 'Tickets Cancelled' : 'Purchase Confirmed!'}
        </h1>
        <p className="text-green-600 text-sm mt-1">
          {cancelled ? 'All tickets have been cancelled.' : `${ticketIds.length} ticket${ticketIds.length > 1 ? 's' : ''} confirmed`}
        </p>
      </div>

      <div className="space-y-3 mb-6">
        {ticketIds.map((id, i) => {
          const ticket = tickets.find(t => t.id === id)
          return (
            <div key={id} className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Ticket #{i + 1}</p>
                  {ticket ? (
                    <p className="text-xs text-gray-500 capitalize">{ticket.zoneType} zone · ${ticket.priceCharged}</p>
                  ) : (
                    <p className="text-xs text-gray-400 font-mono truncate max-w-xs">{id}</p>
                  )}
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                  cancelled || ticket?.status === 'cancelled'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-green-100 text-green-700'
                }`}>
                  {cancelled || ticket?.status === 'cancelled' ? 'Cancelled' : 'Confirmed'}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex gap-3">
        <Link href="/" className="flex-1 text-center bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors text-sm">
          Browse More Shows
        </Link>
        {!cancelled && (
          <button
            onClick={handleCancelAll}
            disabled={cancelling}
            className="flex-1 bg-red-50 text-red-600 border border-red-200 py-3 rounded-lg font-semibold hover:bg-red-100 transition-colors text-sm disabled:opacity-60"
          >
            {cancelling ? 'Cancelling...' : 'Cancel All'}
          </button>
        )}
      </div>
    </div>
  )
}

export default function ConfirmationPage() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-gray-400">Loading...</div>}>
      <ConfirmationContent />
    </Suspense>
  )
}
