import { NextRequest, NextResponse } from 'next/server'
import { listShows } from '@/services/show.service'
import type { ShowType } from '@/domain/types'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get('type') as ShowType | null
  const shows = listShows(type ?? undefined)
  return NextResponse.json(shows)
}
