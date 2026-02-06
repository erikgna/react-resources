import { Card } from '../../../shared/ui/card'
import { formatDateTime } from '../../../shared/lib/format'
import { Order } from '../types'
import { OrderActions } from './order-actions'

interface OrderCardProps {
  order: Order
}

export function OrderCard({ order }: OrderCardProps) {
  const statusColors = {
    queued: 'bg-yellow-100 text-yellow-800',
    preparing: 'bg-blue-100 text-blue-800',
    done: 'bg-green-100 text-green-800'
  }

  return (
    <Card>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold text-gray-900">{order.dishName}</h3>
            <span
              className={`px-2 py-1 rounded text-xs font-medium ${statusColors[order.status]}`}
            >
              {order.status}
            </span>
          </div>
          <div className="text-sm text-gray-600 space-y-1">
            <p>Quantity: {order.quantity}</p>
            <p>Created: {formatDateTime(order.createdAt)}</p>
          </div>
        </div>
        <OrderActions order={order} />
      </div>
    </Card>
  )
}
