import {
  isRouteErrorResponse,
  Link,
  Links,
  Meta,
  NavLink,     // [Declarative] NavLink — Link with built-in active state via render prop
  Outlet,      // [Declarative] Outlet — renders the matched child route
  Scripts,
  ScrollRestoration, // [Declarative] ScrollRestoration — restores scroll on navigation
  useMatches,  // [Data] useMatches — all active route matches root→leaf; used for breadcrumbs
} from "react-router";

import type { Route } from "./+types/root";
import "./app.css";

// [Framework] links() — inject <link> tags for this route (and all children inherit them)
export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <header className="sticky top-0 z-10 flex gap-6 border-b border-gray-200 bg-white/80 px-6 py-3 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-950/80">
          {/* [Declarative] NavLink — isActive / isPending via render prop */}
          {[
            { to: "/", label: "Home", end: true },
            { to: "/dashboard/posts", label: "Dashboard" },
            { to: "/about", label: "About" },
          ].map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `text-sm font-medium transition-colors ${isActive ? "text-gray-900 dark:text-white" : "text-gray-500 hover:text-gray-900 dark:hover:text-white"}`
              }
            >
              {label}
            </NavLink>
          ))}
        </header>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  // [Data] useMatches — breadcrumbs from all active route matches
  const matches = useMatches()
  const crumbs = matches.filter(m => m.pathname !== "/")

  return (
    <>
      {crumbs.length > 0 && (
        <nav className="px-6 py-1.5 border-b border-gray-100 dark:border-gray-800 text-xs text-gray-400 flex gap-1 items-center">
          <Link to="/" className="hover:text-gray-600 dark:hover:text-gray-200">~</Link>
          {crumbs.map(m => (
            <span key={m.id} className="flex items-center gap-1">
              <span className="text-gray-300 dark:text-gray-600">/</span>
              <Link to={m.pathname} className="hover:text-gray-600 dark:hover:text-gray-200">
                {m.pathname.split("/").filter(Boolean).pop()}
              </Link>
            </span>
          ))}
        </nav>
      )}
      <Outlet />
    </>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
