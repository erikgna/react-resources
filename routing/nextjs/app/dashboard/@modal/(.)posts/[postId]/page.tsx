import { notFound } from 'next/navigation'
import { getPost } from '@/lib/data'
import Modal from '../../../_components/Modal'

/*
 * This is using Parallel Routes to display the post in a modal.
 * A parallel route is a route that is rendered alongside the parent route.
 * It's marked using the @ prefix.
 * It works by showing the modal when the route is matched in soft nav and the full page when a hard nav is performed.
 * By using the (.)posts pattern we are intercepting the posts/[postId] page route and showing the modal instead.
 * In layout.tsx, we have a modal slot that will be rendered alongside the children.
 * (.) to match segments on the same level
 * (..) to match segments one level above
 * (..)(..) to match segments two levels above
 * (...) to match segments from the root app directory
 */
export default async function InterceptedPostModal({
  params,
}: {
  params: Promise<{ postId: string }>
}) {
  const { postId } = await params
  const post = getPost(Number(postId))
  if (!post) notFound()

  return (
    <Modal>
      <h2 className="text-lg font-semibold">{post.title}</h2>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">{post.body}</p>
      <p className="text-xs text-zinc-400">Likes: {post.likes}</p>
    </Modal>
  )
}
