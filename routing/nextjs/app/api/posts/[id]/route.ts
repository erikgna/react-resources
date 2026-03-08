import { NextResponse } from 'next/server'
import { getPost } from '@/lib/data'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const post = getPost(Number(id))
  if (!post) return new NextResponse(null, { status: 404 })
  return NextResponse.json(post)
}
