import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

import Loading from '#/components/Loading'
import Error from '#/components/Error'

import type { Post } from '#/types/post'

const postsSearchSchema = z.object({
  page: z.number().catch(1),
  filter: z.string().optional(),
})

export const Route = createFileRoute('/posts/$postId')({
  validateSearch: (search) => postsSearchSchema.parse(search),
  loaderDeps: ({ search: { page, filter } }) => ({ page, filter }),
  loader: async ({ deps }) => (await fetch('/posts').then(res => res.json())) as Post[],
  pendingComponent: () => <Loading />,
  errorComponent: ({ error }) => <Error error={error} />,
  component: RouteComponent,
})

function RouteComponent() {
  const { page, filter } = Route.useSearch()
  const posts = Route.useLoaderData()

  return (
    <div>
      <h3>Posts - Page {page}</h3>
      <input placeholder="Filter posts..." defaultValue={filter} />
      <ul>
        {posts.map(post => (
          <li key={post.id}>{post.title}</li>
        ))}
      </ul>
    </div>
  )
}
