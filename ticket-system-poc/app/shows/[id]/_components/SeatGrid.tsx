'use client'
import type { Seat } from '@/domain/types'

interface Props {
  seats: Seat[]
  cartSeatIds: Set<string>
  onToggle: (seat: Seat) => void
}

export function SeatGrid({ seats, cartSeatIds, onToggle }: Props) {
  const rows = Array.from(new Set(seats.map(s => s.row))).sort()

  if (seats.length === 0) {
    return <p className="text-gray-400 text-sm py-4">No seats available for this zone.</p>
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-3 text-xs text-gray-500 mb-3">
        <span className="flex items-center gap-1"><span className="w-4 h-4 rounded bg-gray-200 inline-block" /> Available</span>
        <span className="flex items-center gap-1"><span className="w-4 h-4 rounded bg-indigo-500 inline-block" /> In Cart</span>
        <span className="flex items-center gap-1"><span className="w-4 h-4 rounded bg-red-300 inline-block" /> Sold</span>
      </div>
      {rows.map(row => (
        <div key={row} className="flex items-center gap-2">
          <span className="text-xs font-mono text-gray-400 w-4">{row}</span>
          <div className="flex gap-1 flex-wrap">
            {seats.filter(s => s.row === row).sort((a, b) => a.number - b.number).map(seat => {
              const inCart = cartSeatIds.has(seat.id)
              const sold = seat.status !== 'available'
              return (
                <button
                  key={seat.id}
                  disabled={sold && !inCart}
                  onClick={() => onToggle(seat)}
                  title={`Row ${seat.row} Seat ${seat.number}`}
                  className={`w-8 h-8 rounded text-xs font-mono font-semibold transition-colors ${
                    inCart
                      ? 'bg-indigo-500 text-white hover:bg-indigo-600'
                      : sold
                      ? 'bg-red-200 text-red-400 cursor-not-allowed'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {seat.number}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
