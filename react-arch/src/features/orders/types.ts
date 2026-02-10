import type { ID, Timestamp } from '../../shared/types/common'

export type OrderStatus = 'queued' | 'preparing' | 'done'

export interface Dish {
  id: ID
  name: string
  baseTimeMs: number
  complexityMultiplier?: number
}

export interface Order {
  id: ID
  dishId: ID
  dishName: string
  quantity: number
  status: OrderStatus
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface CreateOrderInput {
  dishId: ID
  quantity: number
}
