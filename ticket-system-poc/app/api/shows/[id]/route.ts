import { NextRequest, NextResponse } from 'next/server'
import { getShowById, getShowAvailability } from '@/services/show.service'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const show = getShowById(id)
  if (!show) return NextResponse.json({ error: 'Show not found' }, { status: 404 })
  const availability = getShowAvailability(id)
  return NextResponse.json({ show, availability })
}
