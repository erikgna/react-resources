'use client'
import { useQuery } from '@tanstack/react-query'
import type { Show, Seat, ZoneAvailability } from '@/domain/types'

interface ShowDetailResponse {
  show: Show
  availability: ZoneAvailability[]
}

export function useShowDetail(showId: string) {
  return useQuery<ShowDetailResponse>({
    queryKey: ['show', showId],
    queryFn: async () => {
      const res = await fetch(`/api/shows/${encodeURIComponent(showId)}`)
      if (!res.ok) throw new Error('Failed to fetch show')
      return res.json()
    },
    staleTime: 0,
    refetchInterval: 15_000,
  })
}

export function useShowSeats(showId: string, zoneId?: string) {
  return useQuery<Seat[]>({
    queryKey: ['show-seats', showId, zoneId],
    queryFn: async () => {
      const url = zoneId
        ? `/api/shows/${encodeURIComponent(showId)}/seats?zoneId=${encodeURIComponent(zoneId)}`
        : `/api/shows/${encodeURIComponent(showId)}/seats`
      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to fetch seats')
      return res.json()
    },
    staleTime: 0,
    refetchInterval: 15_000,
  })
}
