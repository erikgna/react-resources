import { Link, useLocation, useNavigate, useSearchParams } from "react-router";
import type { Route } from "./+types/about";

// [Framework] links() — inject <link> tags scoped to this route only
export function links(): Route.LinkDescriptors {
  return [{ rel: "preload", href: "/favicon.ico", as: "image" }];
}

// [Framework] meta() — static metadata for this route
export function meta({}: Route.MetaArgs) {
  return [{ title: "About — React Router POC" }];
}

export default function About() {
  // [Declarative] useLocation — current location object (pathname, search, hash, state)
  const location = useLocation();

  // [Declarative] useSearchParams — read/write URL search params on the client
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("tab") ?? "overview";

  // [Declarative] useNavigate — programmatic navigation
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-2xl px-6 py-10 flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">About</h1>

      {/* [Declarative] useLocation — shows current location object */}
      <div className="rounded border border-gray-200 p-3 text-xs font-mono dark:border-gray-800">
        <p className="text-gray-500 mb-1">useLocation()</p>
        <p>pathname: <strong>{location.pathname}</strong></p>
        <p>search: <strong>{location.search || "(empty)"}</strong></p>
      </div>

      {/* [Declarative] useSearchParams — tab state in URL */}
      <div className="flex gap-2">
        {["overview", "details", "links"].map(t => (
          <button
            key={t}
            onClick={() => setSearchParams({ tab: t })}
            className={`px-3 py-1 rounded border text-sm ${tab === t ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900" : "border-gray-300 dark:border-gray-700"}`}
          >
            {t}
          </button>
        ))}
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Active tab from <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 rounded">useSearchParams</code>: <strong>{tab}</strong>
      </p>

      {/* [Declarative] useNavigate — programmatic navigation */}
      <button
        onClick={() => navigate("/dashboard/posts")}
        className="w-fit px-3 py-1 border border-gray-300 rounded text-sm dark:border-gray-700"
      >
        useNavigate() → /dashboard/posts
      </button>

      <Link to="/" className="text-sm text-blue-600 hover:underline dark:text-blue-400">← Home</Link>
    </div>
  );
}
