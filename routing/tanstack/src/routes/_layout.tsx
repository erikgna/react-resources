import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/_layout')({
  component: LayoutComponent,
})

function LayoutComponent() {
  return (
    <div className="page-wrap px-4 pb-8 pt-6 flex gap-8">
      <aside className="w-48 shrink-0 flex flex-col gap-2 pt-1">
        <p className="island-kicker">Pathless Layout</p>
        <p className="text-xs text-[var(--sea-ink-soft)] leading-relaxed">
          This sidebar is injected by <code>_layout.tsx</code> without adding a URL segment.
        </p>
      </aside>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}
