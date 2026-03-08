import { getPosts } from "~/data";

// [Framework] Resource Route — no default component export
// React Router returns the loader response directly as an HTTP response
// Accessible at GET /api/posts and GET /api/posts?filter=<value>
export async function loader({ request }: { request: Request }) {
  const filter = new URL(request.url).searchParams.get("filter") ?? undefined;
  return Response.json(getPosts(filter));
}
