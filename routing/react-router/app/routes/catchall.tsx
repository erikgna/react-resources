import { Link, useLocation } from "react-router";

// [Declarative] wildcard * route — matches any URL not caught by other routes
// useLocation — access current location object (pathname, search, hash, state)
export default function CatchAll() {
  const location = useLocation()

  return (
    <main className="p-8 flex flex-col gap-3">
      <h1 className="text-2xl font-semibold">404</h1>
      <p className="text-gray-600 dark:text-gray-400">
        No route matched:{' '}
        <code className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">
          {location.pathname}
        </code>
      </p>
      <p className="text-xs text-gray-400 font-mono">
        useLocation() → search: &quot;{location.search}&quot; · hash: &quot;{location.hash || '(none)'}&quot;
      </p>
      <Link to="/" className="text-sm text-blue-600 hover:underline dark:text-blue-400">
        ← Back to home
      </Link>
    </main>
  )
}
