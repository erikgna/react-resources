import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { likePost } from '@/lib/data'

export async function POST(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const post = likePost(Number(id))
  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  revalidatePath(`/dashboard/posts/${id}`)
  return NextResponse.json({ likes: post.likes })
}
