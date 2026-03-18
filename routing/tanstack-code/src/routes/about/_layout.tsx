import { createRoute, Outlet } from '@tanstack/react-router'
import { rootRoute } from '../__root'

export const aboutLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: '_about-layout',
  component: LayoutComponent,
})

function LayoutComponent() {
  return (
    <div className="page-wrap px-4 pb-8 pt-6 flex gap-8">
      <aside className="w-48 shrink-0 flex flex-col gap-2 pt-1">
        <p className="island-kicker">Pathless Layout</p>
        <p className="text-xs text-[var(--sea-ink-soft)] leading-relaxed">
          This sidebar is injected by a pathless route (id-based, no URL segment).
        </p>
      </aside>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}
