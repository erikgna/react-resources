import { type NextRequest, NextResponse } from 'next/server'
import { getPosts } from '@/lib/data'

export function GET(request: NextRequest) {
  const filter = request.nextUrl.searchParams.get('filter') ?? undefined
  return NextResponse.json(getPosts(filter))
}
