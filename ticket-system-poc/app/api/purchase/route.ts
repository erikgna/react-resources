import { NextRequest, NextResponse } from 'next/server'
import { validatePurchaseOrder, executePurchase } from '@/services/purchase.service'
import type { PurchaseOrder } from '@/domain/types'

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const order = body as PurchaseOrder
  if (!order.showId || !order.zoneType || !order.date || order.quantity == null) {
    return NextResponse.json({ error: 'Missing required fields: showId, zoneType, date, quantity' }, { status: 400 })
  }

  const validation = validatePurchaseOrder(order)
  if (!validation.valid) {
    return NextResponse.json({ errors: validation.errors }, { status: 422 })
  }

  try {
    const result = executePurchase(order)
    return NextResponse.json(result, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Purchase failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
