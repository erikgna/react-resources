import type { ID, Timestamp } from '../../shared/types/common'
import type { Order } from '../orders/types'

export interface QueueEstimate {
  orderId: ID
  estimatedStartTime: Timestamp
  estimatedCompletionTime: Timestamp
  position: number
  totalWaitTime: number
}

export interface QueueState {
  orders: Order[]
  estimates: QueueEstimate[]
  totalQueueTime: number
}
