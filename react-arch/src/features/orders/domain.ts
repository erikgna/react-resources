import type { Order, OrderStatus, CreateOrderInput, Dish } from './types'
import type { ID, Timestamp } from '../../shared/types/common'

// Creates a new Order using validated domain data
export function createOrder(
  input: CreateOrderInput,
  dishes: Dish[],
  currentTime: Timestamp
): Order {
  const dish = dishes.find(d => d.id === input.dishId)
  if (!dish) throw new Error(`Dish with id ${input.dishId} not found`)

  return {
    id: generateOrderId(),
    dishId: input.dishId,
    dishName: dish.name,
    quantity: input.quantity,
    status: 'queued',
    createdAt: currentTime,
    updatedAt: currentTime
  }
}

// Transition an order to a new status
export function updateOrderStatus(
  order: Order,
  status: OrderStatus,
  currentTime: Timestamp
): Order {
  return {
    ...order,
    status,
    updatedAt: currentTime // Always update timestamp on state change
  }
}

// Guards valid order lifecycle transitions
export function canTransitionTo(
  currentStatus: OrderStatus,
  newStatus: OrderStatus
): boolean {
  const transitions: Record<OrderStatus, OrderStatus[]> = {
    queued: ['preparing', 'done'],
    preparing: ['done'],
    done: []
  }

  return transitions[currentStatus].includes(newStatus)
}

// Generates a reasonably unique order ID without external dependencies
function generateOrderId(): ID {
  return `order_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

// Static menu configuration
export const DISHES: Dish[] = [
  {
    id: 'pasta',
    name: 'Pasta Carbonara',
    baseTimeMs: 15 * 60 * 1000,
    complexityMultiplier: 1.0
  },
  {
    id: 'burger',
    name: 'Classic Burger',
    baseTimeMs: 10 * 60 * 1000,
    complexityMultiplier: 0.8
  },
  {
    id: 'pizza',
    name: 'Margherita Pizza',
    baseTimeMs: 20 * 60 * 1000,
    complexityMultiplier: 1.2
  },
  {
    id: 'salad',
    name: 'Caesar Salad',
    baseTimeMs: 5 * 60 * 1000,
    complexityMultiplier: 0.5
  },
  {
    id: 'steak',
    name: 'Grilled Steak',
    baseTimeMs: 25 * 60 * 1000,
    complexityMultiplier: 1.5
  }
]
