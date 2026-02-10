import { ordersApi } from '../orders/api'
import { DISHES } from '../orders/domain'
import { calculateQueueEstimates, calculateTotalQueueTime } from './domain'
import type { QueueState } from './types'
import { clock } from '../../infrastructure/time/clock'

// API that orchestrates domain and storage
export const queueApi = {
  async getQueueState(): Promise<QueueState> {
    const orders = await ordersApi.getAll()
    const currentTime = clock.now()
    const estimates = calculateQueueEstimates(orders, DISHES, currentTime)
    const totalQueueTime = calculateTotalQueueTime(estimates)

    return {
      orders,
      estimates,
      totalQueueTime
    }
  }
}
