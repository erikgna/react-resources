import { Link } from '@tanstack/react-router'

export function AboutComponent() {
  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-2xl font-semibold">About</h1>
      <p className="text-[var(--sea-ink-soft)]">
        This component is code-split via <code>React.lazy</code>. The route config lives in{' '}
        <code>about/index.tsx</code> and the component is loaded lazily from{' '}
        <code>about/index.lazy.tsx</code>.
      </p>
      <p className="text-[var(--sea-ink-soft)]">
        The pathless layout uses <code>id: '_about-layout'</code> instead of a <code>path</code> — it
        wraps this page with a sidebar without contributing a segment to the URL.
      </p>
      <Link to="/" className="text-[var(--lagoon-deep)] hover:underline text-sm">
        ← Home
      </Link>
    </div>
  )
}
