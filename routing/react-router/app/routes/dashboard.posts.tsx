import { Form, Link, useNavigation, useRevalidator, useSearchParams, isRouteErrorResponse } from "react-router";
import type { Route } from "./+types/dashboard.posts";
import { getPosts } from "~/data";

// [Framework] loader — runs on the SERVER, has access to Node.js APIs
export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const filter = url.searchParams.get("filter") ?? undefined;
  return { posts: getPosts(filter), servedAt: new Date().toISOString() };
}

// [Framework] clientLoader — runs on the CLIENT, can access browser APIs
// Augments server data without replacing it
export async function clientLoader({ serverLoader }: Route.ClientLoaderArgs) {
  const serverData = await serverLoader();
  // Real-world use: read from localStorage, IndexedDB, or a client-side cache
  const lastVisited = typeof window !== "undefined"
    ? (localStorage.getItem("postsLastVisited") ?? "never")
    : "never";
  if (typeof window !== "undefined") {
    localStorage.setItem("postsLastVisited", new Date().toISOString());
  }
  return { ...serverData, lastVisited };
}
// [Framework] hydrate = true — clientLoader runs before first render during SSR hydration
clientLoader.hydrate = true as const;

// [Framework] HydrateFallback — shown while clientLoader runs on the very first page load
export function HydrateFallback() {
  return (
    <div className="flex flex-col gap-3 animate-pulse">
      <div className="h-6 w-32 rounded bg-gray-200 dark:bg-gray-800" />
      {[1, 2, 3].map(i => <div key={i} className="h-4 w-48 rounded bg-gray-200 dark:bg-gray-800" />)}
    </div>
  );
}

// [Data] shouldRevalidate — control when the loader re-runs
export function shouldRevalidate({ currentUrl, nextUrl, defaultShouldRevalidate }: Route.ShouldRevalidateFunctionArgs) {
  // Skip revalidation if only the hash changed
  if (currentUrl.pathname === nextUrl.pathname && currentUrl.search === nextUrl.search) {
    return false;
  }
  return defaultShouldRevalidate;
}

export default function Posts({ loaderData }: Route.ComponentProps) {
  // [Data] useNavigation — pending state during any navigation/submission
  const navigation = useNavigation();
  const isLoading = navigation.state === "loading";

  // [Data] useRevalidator — manually re-run loaders without navigating
  const revalidator = useRevalidator()

  // [Declarative] useSearchParams — read current URL search params on the client
  const [searchParams] = useSearchParams();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-0.5">
        <h1 className={`text-xl font-semibold transition-opacity ${isLoading ? "opacity-40" : ""}`}>
          Posts
        </h1>
        {/* [Framework] clientLoader result — only available in the browser */}
        <p className="text-xs text-gray-400">Last visited: {loaderData.lastVisited}</p>
        <p className="text-xs text-gray-400">Server rendered at: {loaderData.servedAt}</p>
        <button
          onClick={() => revalidator.revalidate()}
          disabled={revalidator.state !== "idle"}
          className="self-start mt-1 px-2 py-0.5 border border-gray-300 rounded text-xs dark:border-gray-700 disabled:opacity-40"
        >
          {revalidator.state !== "idle" ? "Refreshing..." : "Refresh (useRevalidator)"}
        </button>
      </div>

      {/* [Framework] Form — progressively enhanced, works without JavaScript */}
      {/* method="get" — submits as URL search params, no action() needed */}
      <Form method="get" className="flex gap-2">
        <input
          name="filter"
          defaultValue={searchParams.get("filter") ?? ""}
          placeholder="Filter posts..."
          className="border border-gray-300 rounded px-2 py-1 text-sm dark:border-gray-700 dark:bg-gray-900"
        />
        <button type="submit" className="px-3 py-1 border border-gray-300 rounded text-sm dark:border-gray-700">
          Search
        </button>
        {searchParams.get("filter") && (
          <Link to="/dashboard/posts" className="px-3 py-1 text-sm text-gray-500 hover:text-gray-900">
            Clear
          </Link>
        )}
      </Form>

      {/* [Data] useNavigation — show spinner while navigating */}
      {isLoading && <p className="text-xs text-gray-400">Loading...</p>}

      <ul className="flex flex-col gap-2">
        {loaderData.posts.length === 0 && (
          <p className="text-sm text-gray-500">No posts match the filter.</p>
        )}
        {loaderData.posts.map(post => (
          <li key={post.id}>
            {/* [Declarative] Link */}
            <Link
              to={`/dashboard/posts/${post.id}`}
              className="text-sm text-blue-600 hover:underline dark:text-blue-400"
            >
              {post.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

// [Data] ErrorBoundary — per-route error UI, catches loader/render errors
export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  if (isRouteErrorResponse(error)) {
    return <p className="text-red-600">HTTP {error.status}: {error.statusText}</p>;
  }
  return <p className="text-red-600">Error: {error instanceof Error ? error.message : "Unknown error"}</p>;
}
