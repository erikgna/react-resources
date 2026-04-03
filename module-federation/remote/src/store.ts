import { create } from 'zustand'

type Store = {
    count: number
    inc: () => void
}

export const useStore = create<Store>((set) => ({
    count: 0,
    inc: () => set((s) => ({ count: s.count + 1 })),
}))