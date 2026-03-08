import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/')({ component: Home })

const routes: Array<{ label: string; description: string; to: string; params?: Record<string, string> }> = [
  { label: '/dashboard/posts', description: 'auth guard (beforeLoad + context) · search params (Zod) · loaderDeps · pending/error · useRouteContext · useBlocker', to: '/dashboard/posts' },
  { label: '/posts/1', description: 'route params · loader · deferred data (Await) · useParams · notFoundComponent', to: '/posts/$postId', params: { postId: '1' } },
  { label: '/posts/99', description: 'triggers notFound() in loader → notFoundComponent', to: '/posts/$postId', params: { postId: '99' } },
  { label: '/posts/0', description: 'triggers redirect() from loader → /dashboard/posts', to: '/posts/$postId', params: { postId: '0' } },
  { label: '/about', description: 'pathless layout route (_layout.tsx) · createLazyFileRoute', to: '/about' },
  { label: '/not-a-real-page', description: 'unmatched URL → global notFoundComponent on root', to: '/not-a-real-page' },
]

function Home() {
  return (
    <main className="page-wrap px-4 pb-8 pt-10 flex flex-col gap-2">
      <h1 className="text-2xl font-semibold mb-4">TanStack Router POC</h1>
      {routes.map(r => (
        <div key={r.to + (r.params?.postId ?? '')} className="flex flex-col gap-0.5">
          <Link
            to={r.to as never}
            params={r.params as never}
            className="text-[var(--lagoon-deep)] hover:underline font-mono text-sm"
          >
            {r.label}
          </Link>
          <p className="text-xs text-[var(--sea-ink-soft)]">{r.description}</p>
        </div>
      ))}

      {/* Route masking — navigate to /dashboard/posts/1 but show /posts/1 in the URL bar */}
      <div className="flex flex-col gap-0.5 pt-2 border-t border-[var(--line)] mt-2">
        <Link
          to="/posts/$postId"
          params={{ postId: '1' }}
          mask={{ to: '/dashboard/posts/$postId', params: { postId: '1' } }}
          className="text-[var(--lagoon-deep)] hover:underline font-mono text-sm"
        >
          /posts/1 (masked)
        </Link>
        <p className="text-xs text-[var(--sea-ink-soft)]">
          route masking — URL bar shows /posts/1, but the route rendered is /dashboard/posts/1
        </p>
      </div>
    </main>
  )
}
