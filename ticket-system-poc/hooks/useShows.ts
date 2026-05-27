'use client'
import { useQuery } from '@tanstack/react-query'
import type { Show, ShowType } from '@/domain/types'

export function useShows(type?: ShowType) {
  return useQuery<Show[]>({
    queryKey: type ? ['shows', type] : ['shows'],
    queryFn: async () => {
      const url = type ? `/api/shows?type=${type}` : '/api/shows'
      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to fetch shows')
      return res.json()
    },
    staleTime: 0,
  })
}
