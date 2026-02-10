import useSWR, { mutate } from 'swr'
import { ordersApi } from './api'
import type { Order, CreateOrderInput } from './types'
import { DISHES } from './domain'

const ORDERS_KEY = 'orders'
const QUEUE_KEY = 'queue'

// Fetches and caches orders
export function useOrders() {
  const { data, error, isLoading } = useSWR<Order[]>(
    ORDERS_KEY,
    () => ordersApi.getAll(),
    {
      fallbackData: []
    }
  )

  return {
    orders: data ?? [],
    isLoading,
    error
  }
}

// Static menu configuration
export function useDishes() {
  return { dishes: DISHES }
}

// Creates a new order and updates caches
export function useCreateOrder() {
  return async (input: CreateOrderInput) => {
    const order = await ordersApi.create(input)
    await mutate(ORDERS_KEY)
    await mutate(QUEUE_KEY)
    return order
  }
}

// Updates an order status and updates caches
export function useUpdateOrderStatus() {
  return async (orderId: string, status: 'preparing' | 'done') => {
    const order = await ordersApi.updateStatus(orderId, status)
    await mutate(ORDERS_KEY)
    await mutate(QUEUE_KEY)
    return order
  }
}

// Deletes an order and updates caches
export function useDeleteOrder() {
  return async (orderId: string) => {
    await ordersApi.delete(orderId)
    await mutate(ORDERS_KEY)
    await mutate(QUEUE_KEY)
  }
}
