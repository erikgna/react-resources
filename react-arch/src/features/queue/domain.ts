import { Order, Dish } from '../orders/types'
import { QueueEstimate } from './types'
import { Timestamp } from '../../shared/types/common'

export function calculateQueueEstimates(
  orders: Order[],
  dishes: Dish[],
  currentTime: Timestamp
): QueueEstimate[] {
  const dishMap = new Map(dishes.map((d) => [d.id, d]))
  const activeOrders = orders.filter((o) => o.status !== 'done')

  let cumulativeTime = 0
  const estimates: QueueEstimate[] = []

  for (let i = 0; i < activeOrders.length; i++) {
    const order = activeOrders[i]
    const dish = dishMap.get(order.dishId)

    if (!dish) continue

    const prepTime = calculatePrepTime(dish, order.quantity)
    const startTime = currentTime + cumulativeTime
    const completionTime = startTime + prepTime

    estimates.push({
      orderId: order.id,
      estimatedStartTime: startTime,
      estimatedCompletionTime: completionTime,
      position: i + 1,
      totalWaitTime: completionTime - currentTime
    })

    cumulativeTime += prepTime
  }

  return estimates
}

export function calculatePrepTime(dish: Dish, quantity: number): number {
  const multiplier = dish.complexityMultiplier ?? 1
  return dish.baseTimeMs * quantity * multiplier
}

export function estimateWaitTime(
  currentQueue: Order[],
  dishes: Dish[],
  newDishId: string,
  quantity: number,
  currentTime: Timestamp
): number {
  const estimates = calculateQueueEstimates(currentQueue, dishes, currentTime)
  const lastEstimate = estimates[estimates.length - 1]

  const dish = dishes.find((d) => d.id === newDishId)
  if (!dish) return 0

  const startTime = lastEstimate?.estimatedCompletionTime ?? currentTime
  const prepTime = calculatePrepTime(dish, quantity)

  return startTime + prepTime - currentTime
}

export function calculateTotalQueueTime(estimates: QueueEstimate[]): number {
  if (estimates.length === 0) return 0

  const lastEstimate = estimates[estimates.length - 1]
  return lastEstimate.totalWaitTime
}
