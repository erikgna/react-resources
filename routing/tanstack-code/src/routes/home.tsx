import { Link, createRoute } from '@tanstack/react-router'
import { rootRoute } from './root'

export const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: Home,
})

const demoRoutes: Array<{
  label: string
  description: string
  to: string
  params?: Record<string, string>
  search?: Record<string, unknown>
}> = [
  {
    label: '/dashboard/posts',
    description:
      'auth guard (beforeLoad + context) · search params (Zod) · loaderDeps · pending/error · useRouteContext · useBlocker',
    to: '/dashboard/posts',
    search: { page: 1 },
  },
  {
    label: '/dashboard/posts/1',
    description: 'route params · loader · deferred data (Await) · useParams · notFoundComponent',
    to: '/dashboard/posts/$postId',
    params: { postId: '1' },
  },
  {
    label: '/dashboard/posts/99',
    description: 'triggers notFound() in loader → notFoundComponent',
    to: '/dashboard/posts/$postId',
    params: { postId: '99' },
  },
  {
    label: '/dashboard/posts/0',
    description: 'triggers redirect() from loader → /dashboard/posts',
    to: '/dashboard/posts/$postId',
    params: { postId: '0' },
  },
  {
    label: '/about',
    description: 'pathless layout route (id-based, no URL segment) · React.lazy code split',
    to: '/about',
  },
  {
    label: '/not-a-real-page',
    description: 'unmatched URL → global notFoundComponent on root',
    to: '/not-a-real-page',
  },
]

function Home() {
  return (
    <main className="page-wrap px-4 pb-8 pt-10 flex flex-col gap-2">
      <h1 className="text-2xl font-semibold mb-4">TanStack Router — Code-Based Routing POC</h1>
      {demoRoutes.map(r => (
        <div key={r.label} className="flex flex-col gap-0.5">
          <Link
            to={r.to as never}
            params={r.params as never}
            search={r.search as never}
            className="text-(--lagoon-deep) hover:underline font-mono text-sm"
          >
            {r.label}
          </Link>
          <p className="text-xs text-(--sea-ink-soft)">{r.description}</p>
        </div>
      ))}
    </main>
  )
}
