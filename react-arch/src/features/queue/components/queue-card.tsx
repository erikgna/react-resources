import { Card } from '../../../shared/ui/card'
import { formatDuration, formatTime } from '../../../shared/lib/format'
import { Button } from '../../../shared/ui/button'
import { useUpdateOrderStatus } from '../../orders/hooks'
import type { QueueEstimate } from '../types'
import type { Order } from '../../orders/types'
import { useState } from 'react'

interface QueueCardProps {
  order: Order
  estimate: QueueEstimate
}

export function QueueCard({ order, estimate }: QueueCardProps) {
  const updateStatus = useUpdateOrderStatus()
  const [isUpdating, setIsUpdating] = useState(false)

  const handleComplete = async () => {
    setIsUpdating(true)
    try {
      await updateStatus(order.id, 'done')
    } catch (error) {
      console.error('Failed to complete order:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleStartPreparing = async () => {
    setIsUpdating(true)
    try {
      await updateStatus(order.id, 'preparing')
    } catch (error) {
      console.error('Failed to start preparing:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const statusColors = {
    queued: 'bg-yellow-100 text-yellow-800',
    preparing: 'bg-blue-100 text-blue-800',
    done: 'bg-green-100 text-green-800'
  }
console.log(estimate);
  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-semibold text-gray-500">
              #{estimate.position}
            </span>
            <h3 className="font-semibold text-gray-900">{order.dishName}</h3>
            <span
              className={`px-2 py-1 rounded text-xs font-medium ${statusColors[order.status]}`}
            >
              {order.status}
            </span>
          </div>
          <div className="text-sm text-gray-600 space-y-1">
            <p>Quantity: {order.quantity}</p>
            <p>
              Estimated completion: {formatTime(estimate.estimatedCompletionTime)}
            </p>
            <p className="font-medium text-blue-600">
              Wait time: {formatDuration(estimate.totalWaitTime)}
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          {order.status === 'queued' && (
            <Button
              size="sm"
              onClick={handleStartPreparing}
              disabled={isUpdating}
            >
              Start
            </Button>
          )}
          {order.status === 'preparing' && (
            <Button
              size="sm"
              onClick={handleComplete}
              disabled={isUpdating}
            >
              Complete
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}
