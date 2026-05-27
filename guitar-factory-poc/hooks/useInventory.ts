'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Guitar, GuitarType, ModelSeries } from '../domain/types'

type InventoryFilter = {
  type?: GuitarType
  model?: ModelSeries
}

async function fetchInventory(filter: InventoryFilter = {}): Promise<Guitar[]> {
  const params = new URLSearchParams()
  if (filter.type) params.set('type', filter.type)
  if (filter.model) params.set('model', filter.model)
  const qs = params.toString()
  const res = await fetch(`/api/inventory${qs ? `?${qs}` : ''}`)
  if (!res.ok) throw new Error('Failed to fetch inventory')
  return res.json()
}

async function deleteGuitar(id: string): Promise<void> {
  const res = await fetch(`/api/inventory/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete guitar')
}

export function useInventory(filter: InventoryFilter = {}) {
  return useQuery({
    queryKey: ['inventory', filter],
    queryFn: () => fetchInventory(filter),
    staleTime: 0,
  })
}

export function useDeleteGuitar() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteGuitar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
    },
  })
}
