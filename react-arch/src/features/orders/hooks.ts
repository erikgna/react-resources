import useSWR, { mutate } from 'swr'
import { ordersApi } from './api'
import { Order, CreateOrderInput } from './types'
import { DISHES } from './domain'

const ORDERS_KEY = 'orders'
const QUEUE_KEY = 'queue'

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

export function useDishes() {
  return { dishes: DISHES }
}

export function useCreateOrder() {
  return async (input: CreateOrderInput) => {
    const order = await ordersApi.create(input)
    await mutate(ORDERS_KEY)
    await mutate(QUEUE_KEY)
    return order
  }
}

export function useUpdateOrderStatus() {
  return async (orderId: string, status: 'preparing' | 'done') => {
    const order = await ordersApi.updateStatus(orderId, status)
    await mutate(ORDERS_KEY)
    await mutate(QUEUE_KEY)
    return order
  }
}

export function useDeleteOrder() {
  return async (orderId: string) => {
    await ordersApi.delete(orderId)
    await mutate(ORDERS_KEY)
    await mutate(QUEUE_KEY)
  }
}
