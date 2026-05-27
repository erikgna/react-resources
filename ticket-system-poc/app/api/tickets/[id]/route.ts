import { NextRequest, NextResponse } from 'next/server'
import { getTicket } from '@/services/purchase.service'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const ticket = getTicket(id)
  if (!ticket) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
  return NextResponse.json(ticket)
}
