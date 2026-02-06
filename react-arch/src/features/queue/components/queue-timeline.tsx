import { QueueState } from '../types'
import { QueueCard } from './queue-card'

interface QueueTimelineProps {
  queueState: QueueState
}

export function QueueTimeline({ queueState }: QueueTimelineProps) {
  const activeOrders = queueState.orders.filter((o) => o.status !== 'done')

  if (activeOrders.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No orders in queue. All orders are completed or there are no orders yet.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {activeOrders.map((order) => {
        const estimate = queueState.estimates.find((e) => e.orderId === order.id)
        if (!estimate) return null

        return <QueueCard key={order.id} order={order} estimate={estimate} />
      })}
    </div>
  )
}
