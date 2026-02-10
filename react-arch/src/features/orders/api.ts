import { ordersStore } from '../../infrastructure/storage/orders-store'
import type { Order, CreateOrderInput } from './types'
import { createOrder, updateOrderStatus, DISHES } from './domain'
import { clock } from '../../infrastructure/time/clock'
import type { ID } from '../../shared/types/common'

// API that orchestrates domain and storage
export const ordersApi = {
  async getAll(): Promise<Order[]> {
    return ordersStore.getAll()
  },

  async getById(id: ID): Promise<Order | null> {
    return ordersStore.getById(id)
  },

  async create(input: CreateOrderInput): Promise<Order> {
    // Delegate business rules to the domain
    const order = createOrder(input, DISHES, clock.now())

    // Persist through infrastructure layer
    ordersStore.add(order)
    return order
  },

  async updateStatus(
    orderId: ID,
    status: 'preparing' | 'done'
  ): Promise<Order> {
    const order = ordersStore.getById(orderId)
    if (!order) {
      throw new Error(`Order ${orderId} not found`)
    }

    // Transition the order status using domain logic
    const updated = updateOrderStatus(order, status, clock.now())
    ordersStore.update(orderId, updated)
    return updated
  },

  async delete(orderId: ID): Promise<void> {
    ordersStore.delete(orderId)
  }
}
