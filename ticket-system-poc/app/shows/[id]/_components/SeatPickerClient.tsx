'use client'
import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useShowDetail, useShowSeats } from '@/hooks/useShowDetail'
import { useCart } from '@/hooks/useCart'
import { calculatePrice } from '@/domain/pricing'
import { ZoneSelector } from './ZoneSelector'
import { SeatGrid } from './SeatGrid'
import type { ZoneType, Seat } from '@/domain/types'

interface Props {
  showId: string
}

export function SeatPickerClient({ showId }: Props) {
  const router = useRouter()
  const { data, isLoading, error } = useShowDetail(showId)
  const [selectedZone, setSelectedZone] = useState<ZoneType>('general')
  const addSeat = useCart(s => s.addSeat)
  const removeSeat = useCart(s => s.removeSeat)
  const setShow = useCart(s => s.setShow)
  const cartItems = useCart(s => s.items)

  const currentZoneId = useMemo(
    () => data?.availability.find(z => z.zoneType === selectedZone)?.zoneId ?? '',
    [data, selectedZone]
  )

  const { data: seats = [] } = useShowSeats(showId, currentZoneId || undefined)

  const cartSeatIds = useMemo(() => new Set(cartItems.map(i => i.seatId)), [cartItems])

  const selectedZoneData = data?.availability.find(z => z.zoneType === selectedZone)
  const cartTotal = useMemo(() => {
    if (!selectedZoneData) return 0
    return calculatePrice(selectedZone, selectedZoneData.pricePerSeat, cartItems.filter(i => i.showId === showId).length)
  }, [cartItems, selectedZone, selectedZoneData, showId])

  const showCartItems = cartItems.filter(i => i.showId === showId)

  function handleToggleSeat(seat: Seat) {
    if (cartSeatIds.has(seat.id)) {
      removeSeat(seat.id)
    } else {
      setShow(showId)
      addSeat({
        seatId: seat.id,
        showId,
        zoneType: selectedZone,
        row: seat.row,
        number: seat.number,
        pricePerSeat: selectedZoneData?.pricePerSeat ?? 0,
      })
    }
  }

  if (isLoading) return <div className="text-gray-400 py-8 text-center">Loading seat map...</div>
  if (error || !data) return <div className="text-red-500 py-8 text-center">Failed to load show details.</div>

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Select Zone</h2>
        <ZoneSelector
          availability={data.availability}
          selected={selectedZone}
          onSelect={(zone) => { setSelectedZone(zone) }}
        />
      </div>

      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Choose Seats</h2>
        <SeatGrid
          seats={seats}
          cartSeatIds={cartSeatIds}
          onToggle={handleToggleSeat}
        />
      </div>

      {showCartItems.length > 0 && (
        <div className="sticky bottom-0 bg-white border-t border-gray-200 -mx-4 px-4 py-3 flex items-center justify-between shadow-lg">
          <div className="text-sm text-gray-700">
            <span className="font-semibold">{showCartItems.length} seat{showCartItems.length > 1 ? 's' : ''}</span>
            {' — '}
            <span className="font-bold text-gray-900">${cartTotal.toFixed(2)}</span>
            <span className="text-gray-400 text-xs ml-1">({selectedZone} pricing)</span>
          </div>
          <button
            onClick={() => router.push('/cart')}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors"
          >
            Go to Cart
          </button>
        </div>
      )}
    </div>
  )
}
