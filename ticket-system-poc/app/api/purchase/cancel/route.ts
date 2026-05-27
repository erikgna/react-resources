import { NextRequest, NextResponse } from 'next/server'
import { cancelTicket } from '@/services/purchase.service'

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { ticketId } = body as { ticketId?: string }
  if (!ticketId) return NextResponse.json({ error: 'ticketId is required' }, { status: 400 })

  try {
    const ticket = cancelTicket(ticketId)
    return NextResponse.json(ticket)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Cancel failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
