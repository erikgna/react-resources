import { createRootRouteWithContext, Link, Outlet, useMatch, useMatches } from '@tanstack/react-router'
import NotFound from '../components/NotFound'
import '../styles.css'

export interface RouterContext {
  auth: {
    isAuthenticated: boolean
    username: string
  }
}

export const rootRoute = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
  notFoundComponent: NotFound,
})

function RootComponent() {
  return (
    <>
      <header
        className="sticky top-0 z-10 page-wrap flex items-center gap-6 py-4"
        style={{ background: 'var(--header-bg)', backdropFilter: 'blur(8px)' }}
      >
        <Link
          to="/"
          className="nav-link font-semibold"
          activeProps={{ className: 'is-active' }}
          activeOptions={{ exact: true }}
        >
          Home
        </Link>
        <Link
          to="/dashboard/posts"
          search={{ page: 1 }}
          className="nav-link"
          activeProps={{ className: 'is-active' }}
        >
          Dashboard
        </Link>
        <Link to="/about" className="nav-link" activeProps={{ className: 'is-active' }}>
          About
        </Link>
      </header>
      <Breadcrumbs />
      <Outlet />
    </>
  )
}

function Breadcrumbs() {
  const matches = useMatches()
  const postMatch = useMatch({ from: '/dashboard/posts/$postId', shouldThrow: false })
  const crumbs = Array.from(
    new Map(
      matches
        .filter(m => m.pathname !== '/')
        .map(m => [m.pathname.replace(/\/$/, ''), m]),
    ).values(),
  )
  if (crumbs.length === 0) return null

  return (
    <nav className="page-wrap px-4 py-2 flex gap-1.5 items-center text-xs text-[var(--sea-ink-soft)] border-b border-[var(--line)]">
      <Link to="/" className="hover:text-[var(--sea-ink)]">
        home
      </Link>
      {crumbs.map(m => {
        const label = m.pathname.split('/').filter(Boolean).pop() ?? ''
        return (
          <span key={m.id} className="flex gap-1.5 items-center">
            <span className="opacity-40">/</span>
            <Link to={m.pathname as never} className="hover:text-[var(--sea-ink)] capitalize">
              {label}
            </Link>
          </span>
        )
      })}
      {postMatch && (
        <span className="ml-auto text-[var(--lagoon-deep)] font-mono">
          postId: {postMatch.params.postId}
        </span>
      )}
    </nav>
  )
}
