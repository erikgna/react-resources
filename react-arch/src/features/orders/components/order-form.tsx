import { FormEvent, useState } from 'react'
import { Card } from '../../../shared/ui/card'
import { Select } from '../../../shared/ui/select'
import { Input } from '../../../shared/ui/input'
import { Button } from '../../../shared/ui/button'
import { useCreateOrder, useDishes } from '../hooks'

export function OrderForm() {
  const { dishes } = useDishes()
  const createOrder = useCreateOrder()
  const [dishId, setDishId] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!dishId || !quantity) return

    setIsSubmitting(true)
    try {
      await createOrder({
        dishId,
        quantity: parseInt(quantity, 10)
      })
      setDishId('')
      setQuantity('1')
    } catch (error) {
      console.error('Failed to create order:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Create New Order</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          id="dish"
          label="Dish"
          value={dishId}
          onChange={(e) => setDishId(e.target.value)}
          required
        >
          <option value="">Select a dish</option>
          {dishes.map((dish) => (
            <option key={dish.id} value={dish.id}>
              {dish.name}
            </option>
          ))}
        </Select>

        <Input
          id="quantity"
          label="Quantity"
          type="number"
          min="1"
          max="10"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          required
        />

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? 'Creating...' : 'Create Order'}
        </Button>
      </form>
    </Card>
  )
}
