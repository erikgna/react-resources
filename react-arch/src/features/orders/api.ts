import { ordersStore } from '../../infrastructure/storage/orders-store'
import { Order, CreateOrderInput } from './types'
import { createOrder, updateOrderStatus, DISHES } from './domain'
import { clock } from '../../infrastructure/time/clock'
import { ID } from '../../shared/types/common'

export const ordersApi = {
  async getAll(): Promise<Order[]> {
    return ordersStore.getAll()
  },

  async getById(id: ID): Promise<Order | null> {
    return ordersStore.getById(id)
  },

  async create(input: CreateOrderInput): Promise<Order> {
    const order = createOrder(input, DISHES, clock.now())
    ordersStore.add(order)
    return order
  },

  async updateStatus(orderId: ID, status: 'preparing' | 'done'): Promise<Order> {
    const order = ordersStore.getById(orderId)
    if (!order) {
      throw new Error(`Order ${orderId} not found`)
    }

    const updated = updateOrderStatus(order, status, clock.now())
    ordersStore.update(orderId, updated)
    return updated
  },

  async delete(orderId: ID): Promise<void> {
    ordersStore.delete(orderId)
  }
}
