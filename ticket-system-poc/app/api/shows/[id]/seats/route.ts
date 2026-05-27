import { NextRequest, NextResponse } from 'next/server'
import { listSeatsByShow, listSeatsByZone } from '@/services/seat.service'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const zoneId = req.nextUrl.searchParams.get('zoneId')
  const seats = zoneId ? listSeatsByZone(id, zoneId) : listSeatsByShow(id)
  return NextResponse.json(seats)
}
