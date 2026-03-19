import { Link, createRoute, useBlocker } from '@tanstack/react-router'
import { useState } from 'react'
import { z } from 'zod'
import { dashboardRoute } from './dashboard'
import Loading from '#/components/Loading'
import ErrorMsg from '#/components/Error'
import type { Post } from '#/types/post'

const searchSchema = z.object({
  page: z.number().catch(1).default(1),
  filter: z.string().optional(),
})

export const postsRoute = createRoute({
  getParentRoute: () => dashboardRoute,
  path: '/posts',
  validateSearch: searchSchema,
  loaderDeps: ({ search: { page, filter } }) => ({ page, filter }),
  loader: async ({ deps: { page, filter } }) => {
    const params = new URLSearchParams({ page: String(page) })
    if (filter) params.set('filter', filter)
    const res = await fetch(`/posts?${params}`)
    if (!res.ok) throw new Error('Failed to load posts')
    return res.json() as Promise<Post[]>
  },
  pendingComponent: Loading,
  errorComponent: ({ error }) => <ErrorMsg error={error} />,
  component: PostsComponent,
})

function PostsComponent() {
  const { page, filter } = postsRoute.useSearch()
  const posts = postsRoute.useLoaderData()
  const navigate = postsRoute.useNavigate()
  const { auth } = postsRoute.useRouteContext()

  const [note, setNote] = useState('')

  const blocker = useBlocker({
    shouldBlockFn: () => note.length > 0,
    withResolver: true,
  })

  return (
    <div className="page-wrap px-4 pb-8 pt-6 flex flex-col gap-4">
      {blocker.status === 'blocked' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="island-shell rounded-xl p-6 flex flex-col gap-4 w-72">
            <p className="font-medium">Leave with unsaved note?</p>
            <div className="flex gap-2">
              <button
                onClick={() => blocker.proceed()}
                className="px-3 py-1.5 rounded-lg text-sm bg-(--sea-ink) text-white dark:bg-white dark:text-(--sea-ink)"
              >
                Leave
              </button>
              <button
                onClick={() => blocker.reset()}
                className="px-3 py-1.5 border border-(--line) rounded-lg text-sm"
              >
                Stay
              </button>
            </div>
          </div>
        </div>
      )}
      <p className="text-xs text-(--sea-ink-soft)">
        Logged in as: <strong>{auth.username}</strong>
      </p>
      <h2 className="text-xl font-semibold">Posts — Page {page}</h2>

      <input
        className="border border-(--line) rounded-lg px-3 py-2 bg-(--surface) w-64"
        placeholder="Filter posts..."
        defaultValue={filter}
        onChange={e =>
          navigate({ search: prev => ({ ...prev, filter: e.target.value || undefined, page: 1 }) })
        }
      />

      <ul className="flex flex-col gap-2">
        {posts.map(post => (
          <li key={post.id}>
            <Link
              to="/dashboard/posts/$postId"
              params={{ postId: post.id.toString() }}
              className="text-(--lagoon-deep) hover:underline"
            >
              {post.title}
            </Link>
          </li>
        ))}
      </ul>

      <div className="flex gap-2">
        <button
          disabled={page <= 1}
          onClick={() => navigate({ search: prev => ({ ...prev, page: prev.page - 1 }) })}
          className="px-3 py-1 border border-(--line) rounded-lg disabled:opacity-40"
        >
          Prev
        </button>
        <button
          onClick={() => navigate({ search: prev => ({ ...prev, page: prev.page + 1 }) })}
          className="px-3 py-1 border border-(--line) rounded-lg"
        >
          Next
        </button>
      </div>

      <div className="mt-2 flex flex-col gap-2 border-t border-(--line) pt-4">
        <label className="text-sm font-medium">
          Quick Note{' '}
          <span className="text-xs font-normal text-(--sea-ink-soft)">
            useBlocker — type here then navigate away
          </span>
        </label>
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          rows={2}
          placeholder="Start typing to arm the blocker..."
          className="border border-(--line) rounded-lg px-3 py-2 bg-(--surface) text-sm resize-none"
        />
      </div>
    </div>
  )
}
