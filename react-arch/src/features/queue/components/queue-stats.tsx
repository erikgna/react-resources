import { Card } from '../../../shared/ui/card'
import { formatDuration } from '../../../shared/lib/format'
import { QueueState } from '../types'

interface QueueStatsProps {
  queueState: QueueState
}

export function QueueStats({ queueState }: QueueStatsProps) {
  const activeOrders = queueState.orders.filter((o) => o.status !== 'done')

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <Card>
        <div className="text-sm text-gray-600">Total Orders</div>
        <div className="text-2xl font-bold text-gray-900">{activeOrders.length}</div>
      </Card>
      <Card>
        <div className="text-sm text-gray-600">Total Queue Time</div>
        <div className="text-2xl font-bold text-gray-900">
          {formatDuration(queueState.totalQueueTime)}
        </div>
      </Card>
      <Card>
        <div className="text-sm text-gray-600">Avg Wait Per Order</div>
        <div className="text-2xl font-bold text-gray-900">
          {activeOrders.length > 0
            ? formatDuration(queueState.totalQueueTime / activeOrders.length)
            : '0s'}
        </div>
      </Card>
    </div>
  )
}
