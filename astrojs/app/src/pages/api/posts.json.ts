import type { APIRoute } from "astro";
import { getCollection } from "astro:content";

export const GET: APIRoute = async () => {
  const posts = await getCollection("posts", ({ data }) => !data.draft);
  posts.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());

  return new Response(
    JSON.stringify(
      posts.map((p) => ({
        slug: p.slug,
        title: p.data.title,
        date: p.data.date.toISOString(),
        tags: p.data.tags,
        url: `/posts/${p.slug}`,
      })),
      null,
      2
    ),
    { headers: { "Content-Type": "application/json" } }
  );
};
