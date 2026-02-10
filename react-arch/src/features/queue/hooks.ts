import useSWR from 'swr'
import { queueApi } from './api'
import type { QueueState, QueueEstimate } from './types'
import type { ID } from '../../shared/types/common'

const QUEUE_KEY = 'queue'

// Fetches and caches queue state
export function useQueue() {
  const { data, error, isLoading } = useSWR<QueueState>(
    QUEUE_KEY,
    () => queueApi.getQueueState(),
    {
      refreshInterval: 5000,
      fallbackData: {
        orders: [],
        estimates: [],
        totalQueueTime: 0
      }
    }
  )

  return {
    queueState: data ?? { orders: [], estimates: [], totalQueueTime: 0 },
    isLoading,
    error
  }
}

// Fetches and caches a single queue estimate
export function useQueueEstimate(orderId: ID): QueueEstimate | undefined {
  const { queueState } = useQueue()
  return queueState.estimates.find((e) => e.orderId === orderId)
}
