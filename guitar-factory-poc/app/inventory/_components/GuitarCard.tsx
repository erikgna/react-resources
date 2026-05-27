'use client'
import Link from 'next/link'
import type { Guitar } from '../../../domain/types'

type Props = {
  guitar: Guitar
  onDelete?: (id: string) => void
  deleting?: boolean
}

const STATUS_COLORS: Record<Guitar['status'], string> = {
  'in-stock': 'bg-green-100 text-green-800',
  'reserved': 'bg-yellow-100 text-yellow-800',
  'sold': 'bg-gray-100 text-gray-500',
}

const TYPE_ICONS: Record<string, string> = {
  electric: '⚡',
  acoustic: '🌲',
  bass: '🎵',
  'semi-hollow': '🎶',
}

export function GuitarCard({ guitar, onDelete, deleting }: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <span className="text-2xl mr-2">{TYPE_ICONS[guitar.spec.type] ?? '🎸'}</span>
          <span className="font-bold text-gray-900 capitalize">{guitar.spec.modelSeries} {guitar.spec.type}</span>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[guitar.status]}`}>
          {guitar.status}
        </span>
      </div>

      <div className="text-xs text-gray-500 font-mono">{guitar.serialNumber}</div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
        <dt className="text-gray-400">Body</dt><dd className="text-gray-700 capitalize">{guitar.spec.bodyWood}</dd>
        <dt className="text-gray-400">Neck</dt><dd className="text-gray-700 capitalize">{guitar.spec.neckWood}</dd>
        <dt className="text-gray-400">Pickups</dt><dd className="text-gray-700">{guitar.spec.pickupConfig}</dd>
        <dt className="text-gray-400">Scale</dt><dd className="text-gray-700">{guitar.spec.scaleLength}"</dd>
        <dt className="text-gray-400">Finish</dt><dd className="text-gray-700 capitalize">{guitar.spec.finish}</dd>
      </dl>

      {guitar.spec.customNotes && (
        <p className="text-xs text-gray-500 italic border-t pt-2">{guitar.spec.customNotes}</p>
      )}

      <div className="flex gap-2 pt-1">
        <Link href={`/inventory/${guitar.id}`} className="text-xs text-amber-700 hover:underline font-medium">
          Details
        </Link>
        {onDelete && (
          <button
            onClick={() => onDelete(guitar.id)}
            disabled={deleting}
            className="text-xs text-red-500 hover:underline disabled:opacity-40 ml-auto"
          >
            {deleting ? 'Removing...' : 'Remove'}
          </button>
        )}
      </div>
    </div>
  )
}
