import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPost, getPosts } from '@/lib/data'
import LikeButton from './_components/LikeButton'

type Props = { params: Promise<{ postId: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { postId } = await params
  const post = getPost(Number(postId))
  return { title: post ? `${post.title} — Dashboard` : 'Post not found' }
}

export function generateStaticParams() {
  return getPosts().map(p => ({ postId: String(p.id) }))
}

export default async function PostPage({ params }: Props) {
  const { postId } = await params
  const post = getPost(Number(postId))

  if (!post) notFound()

  return (
    <div className="flex flex-col gap-4">
      <Link href="/dashboard/posts" className="text-sm text-blue-600 hover:underline dark:text-blue-400">
        ← Back to posts
      </Link>
      <h1 className="text-2xl font-semibold">{post.title}</h1>
      <p className="text-zinc-600 dark:text-zinc-400">{post.body}</p>
      <LikeButton postId={post.id} likes={post.likes} />
    </div>
  )
}
