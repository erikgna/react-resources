import { createLazyFileRoute, Link } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/_layout/about')({
  component: AboutComponent,
})

function AboutComponent() {
  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-2xl font-semibold">About</h1>
      <p className="text-[var(--sea-ink-soft)]">
        This component is code-split via <code>createLazyFileRoute</code>. The route config lives in{' '}
        <code>_layout.about.tsx</code> and the component is loaded lazily from{' '}
        <code>_layout.about.lazy.tsx</code>.
      </p>
      <p className="text-[var(--sea-ink-soft)]">
        The <code>_layout</code> prefix makes the parent route pathless — it wraps this page with a
        sidebar without contributing a segment to the URL.
      </p>
      <Link to="/" className="text-[var(--lagoon-deep)] hover:underline text-sm">← Home</Link>
    </div>
  )
}
