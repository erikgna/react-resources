import { useOrders } from '../features/orders/hooks'
import { OrderForm } from '../features/orders/components/order-form'
import { OrderList } from '../features/orders/components/order-list'
import { Spinner } from '../shared/ui/spinner'

export function OrdersPage() {
  const { orders, isLoading } = useOrders()

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Orders</h1>

      <div className="mb-8">
        <OrderForm />
      </div>

      {isLoading ? (
        <Spinner />
      ) : (
        <OrderList orders={orders} />
      )}
    </div>
  )
}
