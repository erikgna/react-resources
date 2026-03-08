import { notFound } from 'next/navigation'
import { getPost } from '@/lib/data'
import Modal from '../../../_components/Modal'

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
