import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPost, getPosts } from '@/lib/data'
import LikeButton from './_components/LikeButton'

type Props = { params: Promise<{ postId: string }> }

/*
 * generateMetadata is used to generate the metadata for the postId route.
 * This is used to generate the metadata for the postId route.
 * This is useful for SEO and performance.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { postId } = await params
  const post = getPost(Number(postId))
  return { title: post ? `${post.title} — Dashboard` : 'Post not found' }
}

/*
 * generateStaticParams is used to pre-generate the static pages for the postId route.
 * This is used to avoid the need to generate the page on the fly for each postId.
 * This is useful for SEO and performance.
 */
export function generateStaticParams() {
  return getPosts().map(p => ({ postId: String(p.id) }))
}

export default async function PostPage({ params }: Props) {
  const { postId } = await params
  const post = getPost(Number(postId))

  // If the post is not found, throw a notFound error. This will render the not-found.tsx file.
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
