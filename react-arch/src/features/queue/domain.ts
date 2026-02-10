import type { Order, Dish } from '../orders/types'
import type { QueueEstimate } from './types'
import type { Timestamp } from '../../shared/types/common'

// Calculates queue position and timing estimates for all active orders
export function calculateQueueEstimates(
  orders: Order[],
  dishes: Dish[],
  currentTime: Timestamp
): QueueEstimate[] {
  const dishMap = new Map(dishes.map((d) => [d.id, d]))

  const activeOrders = orders.filter((o) => o.status !== 'done')

  let nextAvailableTime = currentTime
  const estimates: QueueEstimate[] = []

  for (let i = 0; i < activeOrders.length; i++) {
    const order = activeOrders[i]
    const dish = dishMap.get(order.dishId)

    if (!dish) continue

    const prepTime = calculatePrepTime(dish, order.quantity)

    let startTime: Timestamp
    let completionTime: Timestamp

    if (order.status === 'preparing') {
      startTime = order.updatedAt
      const elapsedTime = Math.max(0, currentTime - startTime)
      const remainingTime = Math.max(0, prepTime - elapsedTime)
      completionTime = currentTime + remainingTime
      nextAvailableTime = completionTime
    } else {
      startTime = nextAvailableTime
      completionTime = startTime + prepTime
      nextAvailableTime = completionTime
    }

    estimates.push({
      orderId: order.id,
      estimatedStartTime: startTime,
      estimatedCompletionTime: completionTime,
      position: i + 1,
      totalWaitTime: completionTime - currentTime
    })
  }

  return estimates
}

// Calculates preparation time based on dish complexity and quantity
export function calculatePrepTime(dish: Dish, quantity: number): number {
  const multiplier = dish.complexityMultiplier ?? 1;
  return dish.baseTimeMs * quantity * multiplier;
}

// Estimates how long a new order would take if added to the current queue
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

// Returns total time until the queue is fully processed
export function calculateTotalQueueTime(estimates: QueueEstimate[]): number {
  if (estimates.length === 0) return 0

  const lastEstimate = estimates[estimates.length - 1]
  return lastEstimate.totalWaitTime
}
