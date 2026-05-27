'use client'
import type { ZoneType, ZoneAvailability } from '@/domain/types'

interface Props {
  availability: ZoneAvailability[]
  selected: ZoneType
  onSelect: (zone: ZoneType) => void
}

export function ZoneSelector({ availability, selected, onSelect }: Props) {
  return (
    <div className="flex gap-2 flex-wrap">
      {availability.map(z => {
        const isSoldOut = z.available === 0
        const pct = z.soldCount / z.capacity
        const badgeColor = isSoldOut ? 'bg-red-100 text-red-600' : pct >= 0.8 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
        const isSelected = selected === z.zoneType

        return (
          <button
            key={z.zoneId}
            disabled={isSoldOut}
            onClick={() => onSelect(z.zoneType)}
            className={`px-4 py-3 rounded-lg border-2 text-left transition-all ${
              isSelected
                ? 'border-indigo-500 bg-indigo-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            } ${isSoldOut ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <div className="font-semibold text-sm uppercase text-gray-700">{z.zoneType}</div>
            <div className="text-lg font-bold text-gray-900">${z.pricePerSeat}</div>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badgeColor}`}>
              {isSoldOut ? 'Sold Out' : `${z.available} left`}
            </span>
          </button>
        )
      })}
    </div>
  )
}
