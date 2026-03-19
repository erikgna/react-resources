import { Await, Form, Link, isRouteErrorResponse, useActionData, useFetcher, useLoaderData, useParams } from "react-router";
import { Suspense } from "react";
import type { Route } from "./+types/dashboard.posts.$postId";
import { getPost, getRelatedPosts, likePost, toggleBookmark } from "~/data";

// [Framework] meta() — dynamic metadata using data returned from loader
export function meta({ data }: Route.MetaArgs) {
  if (!data?.post) return [{ title: "Post not found" }];
  return [{ title: `${data.post.title} — Dashboard` }];
}

// [Framework] loader — SERVER only, params are typed from the route definition
export async function loader({ params }: Route.LoaderArgs) {
  const post = getPost(Number(params.postId));

  // [Framework] Throwing a Response — React Router catches it and renders ErrorBoundary
  if (!post) throw new Response("Not Found", { status: 404, statusText: "Post not found" });

  // [Data] defer() — return the critical data awaited, slow data as a Promise
  // The component renders immediately with `post`, then streams `relatedPosts` when ready
  return {
    post,
    relatedPosts: new Promise<ReturnType<typeof getRelatedPosts>>(resolve =>
      setTimeout(() => resolve(getRelatedPosts(Number(params.postId))), 800)
    ),
  };
}

// [Framework] action — handles form POST submissions on the SERVER
export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");
  const id = Number(params.postId);

  if (intent === "like") {
    const post = likePost(id);
    if (!post) throw new Response("Not Found", { status: 404 });
    return { liked: true, likes: post.likes };
  }

  if (intent === "bookmark") {
    const post = toggleBookmark(id);
    if (!post) throw new Response("Not Found", { status: 404 });
    return { bookmarked: post.bookmarked };
  }

  throw new Response("Unknown intent", { status: 400 });
}

// [Framework] clientAction — runs on the CLIENT after the server action completes
// Useful for updating client-side state (local cache, optimistic UI cleanup) post-mutation
export async function clientAction({ serverAction }: Route.ClientActionArgs) {
  const result = await serverAction()
  return result
}

export default function PostDetail() {
  // [Data] useLoaderData — access the data returned from loader (typed)
  const { post, relatedPosts } = useLoaderData<typeof loader>();

  // [Data] useActionData — access the data returned from the last action submission
  const actionData = useActionData<typeof action>();

  // [Declarative] useParams — access dynamic route params directly in the component
  const { postId } = useParams();

  // [Data] useFetcher — submit to an action without causing a navigation
  // Perfect for inline mutations (bookmarks, toggles, ratings)
  const bookmarkFetcher = useFetcher<typeof action>();
  const isBookmarked = bookmarkFetcher.formData
    ? bookmarkFetcher.formData.get("intent") === "bookmark" // optimistic
    : post.bookmarked;

  return (
    <div className="flex flex-col gap-4">
      <Link to="/dashboard/posts" className="text-sm text-blue-600 hover:underline dark:text-blue-400">
        ← Back to posts
      </Link>

      {/* [Declarative] useParams */}
      <p className="text-xs text-gray-400 font-mono">useParams() → postId: {postId}</p>

      <h1 className="text-2xl font-semibold">{post.title}</h1>
      <p className="text-gray-600 dark:text-gray-400">{post.body}</p>

      {/* [Framework] Form method="post" — triggers action(), works without JavaScript */}
      <Form method="post" className="flex items-center gap-3">
        <input type="hidden" name="intent" value="like" />
        <button
          type="submit"
          className="px-3 py-1 border border-gray-300 rounded text-sm dark:border-gray-700"
        >
          👍 Like ({post.likes})
        </button>
        {/* [Data] useActionData — shows result from the last action */}
        {actionData && "liked" in actionData && (
          <span className="text-xs text-green-600">Liked! Now at {actionData.likes} likes.</span>
        )}
      </Form>

      {/* [Data] useFetcher.Form — submits to action without navigating away */}
      <bookmarkFetcher.Form method="post">
        <input type="hidden" name="intent" value="bookmark" />
        <button
          type="submit"
          disabled={bookmarkFetcher.state !== "idle"}
          className="px-3 py-1 border border-gray-300 rounded text-sm dark:border-gray-700 disabled:opacity-40"
        >
          {bookmarkFetcher.state !== "idle" ? "..." : isBookmarked ? "★ Bookmarked" : "☆ Bookmark"}
        </button>
      </bookmarkFetcher.Form>

      {/* [Data] defer + Await — render now, stream slow data later via Suspense */}
      <h2 className="text-lg font-semibold mt-4">Related Posts</h2>
      <Suspense fallback={<p className="text-xs text-gray-400 animate-pulse">Loading related posts...</p>}>
        <Await resolve={relatedPosts}>
          {(related) => (
            <ul className="flex flex-col gap-1">
              {related.map(r => (
                <li key={r.id}>
                  <Link
                    to={`/dashboard/posts/${r.id}`}
                    className="text-sm text-blue-600 hover:underline dark:text-blue-400"
                  >
                    {r.title}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Await>
      </Suspense>
    </div>
  );
}

// [Data] ErrorBoundary — catches errors thrown in loader or action
export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  if (isRouteErrorResponse(error)) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-gray-600 dark:text-gray-400">{error.statusText}</p>
        <Link to="/dashboard/posts" className="text-sm text-blue-600 hover:underline dark:text-blue-400">
          ← Back to posts
        </Link>
      </div>
    );
  }
  return <p className="text-red-600">{error instanceof Error ? error.message : "Unknown error"}</p>;
}
