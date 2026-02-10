import type { Order } from '../types'
import { OrderCard } from './order-card'

interface OrderListProps {
  orders: Order[]
}

export function OrderList({ orders }: OrderListProps) {
  if (orders.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No orders yet. Create your first order above.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <OrderCard key={order.id} order={order} />
      ))}
    </div>
  )
}
