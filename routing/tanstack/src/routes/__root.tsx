import { Link, Outlet, createRootRouteWithContext, useMatch, useMatches } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import type { RouterContext } from '../router'

import '../styles.css'

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
})

function RootComponent() {
  return (
    <>
      <header className="sticky top-0 z-10 page-wrap flex items-center gap-6 py-4" style={{ background: 'var(--header-bg)', backdropFilter: 'blur(8px)' }}>
        <Link to="/" className="nav-link font-semibold" activeProps={{ className: 'is-active' }} activeOptions={{ exact: true }}>
          Home
        </Link>
        <Link to="/dashboard/posts" className="nav-link" activeProps={{ className: 'is-active' }}>
          Dashboard
        </Link>
        <Link to="/about" className="nav-link" activeProps={{ className: 'is-active' }}>
          About
        </Link>
      </header>
      <Breadcrumbs />
      <Outlet />
      <TanStackDevtools
        config={{ position: 'bottom-right' }}
        plugins={[{ name: 'TanStack Router', render: <TanStackRouterDevtoolsPanel /> }]}
      />
    </>
  )
}

function Breadcrumbs() {
  // useMatches — returns every route match currently active in the tree (root → leaf)
  const matches = useMatches()

  // useMatch — check if one specific route is matched; returns null if not
  const postMatch = useMatch({ from: '/posts/$postId', shouldThrow: false })

  const crumbs = matches.filter(m => m.pathname !== '/' && !m.id.startsWith('/_layout'))
  if (crumbs.length === 0) return null

  return (
    <nav className="page-wrap px-4 py-2 flex gap-1.5 items-center text-xs text-[var(--sea-ink-soft)] border-b border-[var(--line)]">
      <Link to="/" className="hover:text-[var(--sea-ink)]">home</Link>
      {crumbs.map(m => {
        const label = m.pathname.split('/').filter(Boolean).pop() ?? ''
        return (
          <span key={m.id} className="flex gap-1.5 items-center">
            <span className="opacity-40">/</span>
            <Link to={m.pathname as never} className="hover:text-[var(--sea-ink)] capitalize">{label}</Link>
          </span>
        )
      })}
      {/* useMatch — specific route check, here used to badge the current postId */}
      {postMatch && (
        <span className="ml-auto text-[var(--lagoon-deep)] font-mono">postId: {postMatch.params.postId}</span>
      )}
    </nav>
  )
}

function NotFoundComponent() {
  return (
    <div className="page-wrap px-4 pt-10 flex flex-col gap-3">
      <h1 className="text-2xl font-semibold">404 — Page not found</h1>
      <Link to="/" className="text-[var(--lagoon-deep)] hover:underline">← Go home</Link>
    </div>
  )
}
