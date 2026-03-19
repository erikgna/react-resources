import { Outlet, createRoute } from '@tanstack/react-router'
import { Suspense, lazy } from 'react'
import { rootRoute } from './root'
import Loading from '#/components/Loading'

export const aboutLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: '_about-layout',
  component: AboutLayout,
})

function AboutLayout() {
  return (
    <div className="page-wrap px-4 pb-8 pt-6 flex gap-8">
      <aside className="w-48 shrink-0 flex flex-col gap-2 pt-1">
        <p className="island-kicker">Pathless Layout</p>
        <p className="text-xs text-(--sea-ink-soft) leading-relaxed">
          This sidebar is injected by a pathless route (id-based, no URL segment).
        </p>
      </aside>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}

const LazyAboutComponent = lazy(() =>
  import('#/pages/about.lazy').then(m => ({ default: m.AboutComponent })),
)

export const aboutRoute = createRoute({
  getParentRoute: () => aboutLayoutRoute,
  path: '/about',
  component: () => (
    <Suspense fallback={<Loading />}>
      <LazyAboutComponent />
    </Suspense>
  ),
})
