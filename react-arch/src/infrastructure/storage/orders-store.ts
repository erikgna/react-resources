import { storage } from './local-storage'
import type { Order } from '../../features/orders/types'
import type { ID } from '../../shared/types/common'

const ORDERS_KEY = 'restaurant:orders'

export const ordersStore = {
  getAll(): Order[] {
    return storage.get<Order[]>(ORDERS_KEY) ?? []
  },

  getById(id: ID): Order | null {
    const orders = this.getAll()
    return orders.find(o => o.id === id) ?? null
  },

  save(orders: Order[]): void {
    storage.set(ORDERS_KEY, orders)
  },

  add(order: Order): void {
    const orders = this.getAll()
    this.save([...orders, order])
  },

  update(orderId: ID, updates: Partial<Order>): void {
    const orders = this.getAll()
    const updated = orders.map(o =>
      o.id === orderId ? { ...o, ...updates } : o
    )
    this.save(updated)
  },

  delete(orderId: ID): void {
    const orders = this.getAll()
    this.save(orders.filter(o => o.id !== orderId))
  },

  clear(): void {
    storage.remove(ORDERS_KEY)
  }
}
