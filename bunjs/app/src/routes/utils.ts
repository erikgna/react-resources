function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  })
}

export async function handleUtils(req: Request): Promise<Response | null> {
  const url = new URL(req.url)
  const path = url.pathname

  // GET /utils/escape?html=<script>alert(1)</script>
  if (req.method === "GET" && path === "/utils/escape") {
    const html = url.searchParams.get("html") ?? '<script>alert("xss")</script><b>bold</b>'
    const escaped = Bun.escapeHTML(html)
    return json({
      input: html,
      escaped,
      note: "Bun.escapeHTML() escapes & < > \" ' — SIMD accelerated, faster than manual replace chains",
    })
  }

  // GET /utils/peek — Bun.peek() synchronous Promise inspection
  if (req.method === "GET" && path === "/utils/peek") {
    const resolved = Promise.resolve(42)
    const pending = new Promise<number>((resolve) => setTimeout(resolve, 10_000, 99))
    const rejected = Promise.reject(new Error("expected rejection")).catch(() => {})
    // Consume rejection so Node doesn't warn; we peek before it settles

    const rejectedRaw = Promise.reject(new Error("peek rejection"))
    rejectedRaw.catch(() => {}) // suppress unhandled

    const peekResolved = Bun.peek(resolved)
    const peekPending = Bun.peek(pending)

    // peek.status tells you the state without consuming the value
    const statusResolved = Bun.peek.status(resolved)
    const statusPending = Bun.peek.status(pending)
    const statusRejected = Bun.peek.status(rejectedRaw)

    return json({
      resolved: {
        peek: peekResolved,       // 42 — sync, no await
        status: statusResolved,   // "fulfilled"
      },
      pending: {
        peek: String(peekPending === pending ? "returned Promise itself" : peekPending),
        status: statusPending,    // "pending"
      },
      rejected: {
        status: statusRejected,   // "rejected"
      },
      note: "Bun.peek() lets you read a Promise's value synchronously if already settled — useful for caching layers that want to avoid async overhead on cache hits.",
    })
  }

  // GET /utils/which?cmd=bun
  if (req.method === "GET" && path === "/utils/which") {
    const cmds = url.searchParams.get("cmd")?.split(",") ?? ["bun", "node", "git", "nonexistent-cmd"]
    const results: Record<string, string | null> = {}
    for (const cmd of cmds) {
      results[cmd.trim()] = Bun.which(cmd.trim())
    }
    return json({ results, note: "Bun.which() resolves executable path from PATH — no shell needed" })
  }

  // GET /utils/version — Bun runtime metadata
  if (req.method === "GET" && path === "/utils/version") {
    return json({
      version: Bun.version,
      revision: Bun.revision,
      main: Bun.main,
      isMainThread: typeof WorkerGlobalScope === "undefined",
      uptimeNs: Bun.nanoseconds(),
      env: {
        NODE_ENV: process.env.NODE_ENV ?? "development",
        HOME: process.env.HOME,
        PATH: process.env.PATH?.split(":").slice(0, 5).join(":") + "…",
      },
    })
  }

  return null
}
