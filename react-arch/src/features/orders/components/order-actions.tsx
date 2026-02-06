import { useState } from 'react'
import { Button } from '../../../shared/ui/button'
import { useUpdateOrderStatus, useDeleteOrder } from '../hooks'
import { Order } from '../types'

interface OrderActionsProps {
  order: Order
}

export function OrderActions({ order }: OrderActionsProps) {
  const updateStatus = useUpdateOrderStatus()
  const deleteOrder = useDeleteOrder()
  const [isUpdating, setIsUpdating] = useState(false)

  const handleStatusUpdate = async (newStatus: 'preparing' | 'done') => {
    setIsUpdating(true)
    try {
      await updateStatus(order.id, newStatus)
    } catch (error) {
      console.error('Failed to update order:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this order?')) return

    try {
      await deleteOrder(order.id)
    } catch (error) {
      console.error('Failed to delete order:', error)
    }
  }

  if (order.status === 'done') {
    return (
      <Button variant="secondary" size="sm" onClick={handleDelete}>
        Remove
      </Button>
    )
  }

  return (
    <div className="flex gap-2">
      {order.status === 'queued' && (
        <Button
          size="sm"
          onClick={() => handleStatusUpdate('preparing')}
          disabled={isUpdating}
        >
          Start Preparing
        </Button>
      )}
      {order.status === 'preparing' && (
        <Button
          size="sm"
          onClick={() => handleStatusUpdate('done')}
          disabled={isUpdating}
        >
          Mark Done
        </Button>
      )}
      <Button variant="danger" size="sm" onClick={handleDelete}>
        Cancel
      </Button>
    </div>
  )
}
