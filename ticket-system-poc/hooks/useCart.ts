'use client'
import { create } from 'zustand'
import type { SeatId, ZoneType, ShowId } from '@/domain/types'

export interface CartItem {
  seatId: SeatId
  showId: ShowId
  zoneType: ZoneType
  row: string
  number: number
  pricePerSeat: number
}

interface CartStore {
  items: CartItem[]
  showId: ShowId | null
  addSeat: (item: CartItem) => void
  removeSeat: (seatId: SeatId) => void
  clear: () => void
  setShow: (showId: ShowId) => void
}

export const useCart = create<CartStore>((set) => ({
  items: [],
  showId: null,
  addSeat: (item) =>
    set((state) => {
      if (state.items.some(i => i.seatId === item.seatId)) return state
      return { items: [...state.items, item] }
    }),
  removeSeat: (seatId) =>
    set((state) => ({ items: state.items.filter(i => i.seatId !== seatId) })),
  clear: () => set({ items: [], showId: null }),
  setShow: (showId) => set({ showId }),
}))
