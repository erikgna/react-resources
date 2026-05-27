'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { PurchaseOrder, Ticket } from '@/domain/types'
import { useCart } from './useCart'

interface PurchaseResult {
  tickets: Ticket[]
  totalPrice: number
}

interface PurchaseError {
  errors?: string[]
  error?: string
}

export function usePurchase(showId: string) {
  const queryClient = useQueryClient()
  const clear = useCart(s => s.clear)

  return useMutation<PurchaseResult, PurchaseError, PurchaseOrder>({
    mutationFn: async (order: PurchaseOrder) => {
      const res = await fetch('/api/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order),
      })
      const data = await res.json()
      if (!res.ok) throw data as PurchaseError
      return data as PurchaseResult
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shows'] })
      queryClient.invalidateQueries({ queryKey: ['show', showId] })
      queryClient.invalidateQueries({ queryKey: ['show-seats', showId] })
      clear()
    },
  })
}
