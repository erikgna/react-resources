'use client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useCart } from '@/hooks/useCart'
import { usePurchase } from '@/hooks/usePurchase'
import { calculatePrice } from '@/domain/pricing'

export default function CartPage() {
  const router = useRouter()
  const items = useCart(s => s.items)
  const removeSeat = useCart(s => s.removeSeat)
  const showId = useCart(s => s.showId)

  const purchase = usePurchase(showId ?? '')

  const totalPrice = items.reduce((sum, item) => {
    return sum + calculatePrice(item.zoneType, item.pricePerSeat, 1)
  }, 0)

  if (items.length === 0) {
    return (
      <div className="max-w-xl mx-auto py-20 text-center">
        <p className="text-gray-400 text-lg mb-4">Cart is empty</p>
        <Link href="/" className="text-indigo-600 hover:underline text-sm">Browse Shows</Link>
      </div>
    )
  }

  async function handlePurchase() {
    if (!showId || items.length === 0) return

    // All items are same show — group by zone
    const byZone = items.reduce<Record<string, typeof items>>(
      (acc, item) => { (acc[item.zoneType] ??= []).push(item); return acc },
      {}
    )

    let allTicketIds: string[] = []

    for (const [zoneType, zoneItems] of Object.entries(byZone)) {
      const result = await purchase.mutateAsync({
        showId,
        seatIds: zoneItems.map(i => i.seatId),
        zoneType: zoneType as 'vip' | 'premium' | 'general',
        quantity: zoneItems.length,
        date: new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0],
      })
      allTicketIds = [...allTicketIds, ...result.tickets.map(t => t.id)]
    }

    router.push(`/confirmation?tickets=${allTicketIds.join(',')}`)
  }

  const purchaseErrors = purchase.error?.errors ?? (purchase.error?.error ? [purchase.error.error] : [])

  return (
    <div className="max-w-xl mx-auto py-10 px-4">
      <Link href="/" className="text-sm text-indigo-600 hover:underline mb-6 inline-block">&larr; Continue Shopping</Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Your Cart</h1>

      {purchaseErrors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-700 text-sm font-semibold mb-1">Purchase failed:</p>
          <ul className="list-disc list-inside text-red-600 text-sm space-y-1">
            {purchaseErrors.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        </div>
      )}

      <div className="space-y-3 mb-6">
        {items.map(item => (
          <div key={item.seatId} className="bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-900">
                Row {item.row}, Seat {item.number}
              </p>
              <p className="text-xs text-gray-500 capitalize">{item.zoneType} zone</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-bold text-gray-900">${calculatePrice(item.zoneType, item.pricePerSeat, 1).toFixed(2)}</span>
              <button
                onClick={() => removeSeat(item.seatId)}
                className="text-xs text-red-500 hover:text-red-700"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-between mb-4">
        <span className="font-semibold text-gray-700">Total</span>
        <span className="text-xl font-bold text-gray-900">${totalPrice.toFixed(2)}</span>
      </div>

      <button
        onClick={handlePurchase}
        disabled={purchase.isPending}
        className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {purchase.isPending ? 'Processing...' : `Purchase ${items.length} Ticket${items.length > 1 ? 's' : ''}`}
      </button>
    </div>
  )
}
