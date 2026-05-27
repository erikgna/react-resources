'use client'
import { useState } from 'react'
import { useInventory, useDeleteGuitar } from '../../../hooks/useInventory'
import { GuitarCard } from './GuitarCard'
import type { GuitarType, ModelSeries } from '../../../domain/types'
import { GUITAR_OPTIONS } from '../../../domain/types'

export function InventoryClient() {
  const [typeFilter, setTypeFilter] = useState<GuitarType | ''>('')
  const [modelFilter, setModelFilter] = useState<ModelSeries | ''>('')

  const { data: guitars, isLoading, error, refetch } = useInventory({
    type: typeFilter || undefined,
    model: modelFilter || undefined,
  })
  const { mutate: deleteGuitar, isPending, variables: deletingId } = useDeleteGuitar()

  if (isLoading) return <div className="text-gray-400 py-8 text-center">Loading inventory...</div>
  if (error) return (
    <div className="bg-red-50 border border-red-300 text-red-700 text-sm rounded px-4 py-3">
      Failed to load inventory. <button onClick={() => refetch()} className="underline">Retry</button>
    </div>
  )

  const list = guitars ?? []

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <select
          className="border border-gray-300 rounded px-3 py-1.5 text-sm"
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value as GuitarType | '')}
        >
          <option value="">All types</option>
          {GUITAR_OPTIONS.types.map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
        </select>
        <select
          className="border border-gray-300 rounded px-3 py-1.5 text-sm"
          value={modelFilter}
          onChange={e => setModelFilter(e.target.value as ModelSeries | '')}
        >
          <option value="">All series</option>
          {GUITAR_OPTIONS.modelSeries.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        {(typeFilter || modelFilter) && (
          <button onClick={() => { setTypeFilter(''); setModelFilter('') }} className="text-xs text-gray-500 hover:underline">
            Clear filters
          </button>
        )}
        <span className="ml-auto text-sm text-gray-400">{list.length} guitar{list.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Grid */}
      {list.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-4xl mb-3">🎸</div>
          <p>No guitars in inventory{(typeFilter || modelFilter) ? ' matching filters' : ''}.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.map(g => (
            <GuitarCard
              key={g.id}
              guitar={g}
              onDelete={id => deleteGuitar(id)}
              deleting={isPending && deletingId === g.id}
            />
          ))}
        </div>
      )}
    </div>
  )
}
