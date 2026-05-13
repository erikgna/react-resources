import { join } from "path"

// FileSystemRouter maps URL patterns to files — Next.js-style routing without a framework
const router = new Bun.FileSystemRouter({
  style: "nextjs",
  dir: join(import.meta.dir, "../pages"),
  fileExtensions: [".ts"],
})

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  })
}

export async function handleFsRouter(req: Request): Promise<Response | null> {
  const url = new URL(req.url)
  const path = url.pathname

  // GET /router/routes — list all registered routes
  if (req.method === "GET" && path === "/router/routes") {
    return json({
      routes: router.routes,
      note: "Bun.FileSystemRouter scans the pages/ dir and builds a route table from filenames",
    })
  }

  // GET /router/match?path=/tasks/42&qs=foo=bar
  if (req.method === "GET" && path === "/router/match") {
    const matchPath = url.searchParams.get("path") ?? "/"
    const qs = url.searchParams.get("qs") ?? ""
    const fullPath = qs ? `${matchPath}?${qs}` : matchPath

    const match = router.match(fullPath)

    if (!match) return json({ matched: false, path: fullPath })

    return json({
      matched: true,
      input: fullPath,
      name: match.name,           // "/tasks/[id]"
      kind: match.kind,           // "dynamic" | "exact" | "catch-all"
      params: match.params,       // { id: "42" }
      query: match.query,         // { foo: "bar" }
      filePath: match.filePath,   // absolute path on disk
    })
  }

  // GET /router/demo — show all routes resolved with example URLs
  if (req.method === "GET" && path === "/router/demo") {
    const examples = [
      "/",
      "/tasks",
      "/tasks/99",
      "/blog/hello-world",
      "/anything/deeply/nested",
    ]

    const results = examples.map((p) => {
      const match = router.match(p)
      if (!match) return { path: p, matched: false }
      return {
        path: p,
        matched: true,
        name: match.name,
        kind: match.kind,
        params: match.params,
      }
    })

    return json({ results })
  }

  return null
}
