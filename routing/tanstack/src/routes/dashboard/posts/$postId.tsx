import { Await, Link, createFileRoute, notFound, redirect } from '@tanstack/react-router'
import { Suspense } from 'react'

import Loading from '#/components/Loading'
import ErrorMsg from '#/components/Error'

import type { Post } from '#/types/post'

export const Route = createFileRoute('/dashboard/posts/$postId')({
  loader: async ({ params: { postId } }) => {
    if (postId === '0') throw redirect({ to: '/dashboard/posts', search: { page: 1 } })

    const res = await fetch(`/posts/${postId}`)
    if (!res.ok) throw notFound()

    const post = (await res.json()) as Post
    const relatedPosts = fetch(`/posts/${postId}/related`).then(r => r.json()) as Promise<Post[]>

    return { post, relatedPosts }
  },
  notFoundComponent: () => (
    <div className="page-wrap px-4 pt-6 flex flex-col gap-3">
      <p className="text-[var(--sea-ink-soft)]">Post not found.</p>
      <Link to="/dashboard/posts" className="text-[var(--lagoon-deep)] hover:underline">← Back to posts</Link>
    </div>
  ),
  pendingComponent: Loading,
  errorComponent: ({ error }) => <ErrorMsg error={error} />,
  component: PostComponent,
})

function PostComponent() {
  const { post, relatedPosts } = Route.useLoaderData()
  const { postId } = Route.useParams()

  return (
    <div className="page-wrap px-4 pb-8 pt-6 flex flex-col gap-4">
      <Link to="/dashboard/posts" className="text-sm text-[var(--lagoon-deep)] hover:underline">
        ← Back to posts
      </Link>
      <p className="text-xs text-[var(--sea-ink-soft)]">useParams → postId: <strong>{postId}</strong></p>
      <h1 className="text-2xl font-semibold">{post.title}</h1>
      <p className="text-[var(--sea-ink-soft)]">{post.body}</p>

      <h2 className="text-lg font-semibold mt-4">Related posts</h2>
      <Suspense fallback={<Loading />}>
        <Await promise={relatedPosts}>
          {(related: Post[]) => (
            <ul className="flex flex-col gap-1">
              {related.map((r: Post) => (
                <li key={r.id}>
                  <Link
                    to="/dashboard/posts/$postId"
                    params={{ postId: r.id.toString() }}
                    className="text-[var(--lagoon-deep)] hover:underline"
                  >
                    {r.title}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Await>
      </Suspense>
    </div>
  )
}
