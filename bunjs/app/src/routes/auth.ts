function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  })
}

export async function handleAuth(req: Request): Promise<Response | null> {
  const url = new URL(req.url)
  const path = url.pathname

  // POST /auth/hash — hash a password with argon2id (default) or bcrypt
  if (req.method === "POST" && path === "/auth/hash") {
    const body = await req.json<{ password?: string; algorithm?: "argon2id" | "bcrypt" }>()
    if (!body.password) return json({ error: "password required" }, 400)

    const algorithm = body.algorithm ?? "argon2id"
    const start = performance.now()
    const hash = await Bun.password.hash(body.password, algorithm)
    const elapsed = performance.now() - start

    return json({
      hash,
      algorithm,
      elapsedMs: Math.round(elapsed),
      length: hash.length,
    })
  }

  // POST /auth/verify — verify a password against a hash
  if (req.method === "POST" && path === "/auth/verify") {
    const body = await req.json<{ password?: string; hash?: string }>()
    if (!body.password || !body.hash) return json({ error: "password and hash required" }, 400)

    const start = performance.now()
    const match = await Bun.password.verify(body.password, body.hash)
    const elapsed = performance.now() - start

    return json({ match, elapsedMs: Math.round(elapsed) })
  }

  // GET /auth/compare — side-by-side argon2id vs bcrypt timing
  if (req.method === "GET" && path === "/auth/compare") {
    const password = "benchmark-password-123"

    const [argon2idHash, bcryptHash] = await Promise.all([
      Bun.password.hash(password, "argon2id"),
      Bun.password.hash(password, "bcrypt"),
    ])

    const [argon2idVerify, bcryptVerify] = await Promise.all([
      time(() => Bun.password.verify(password, argon2idHash)),
      time(() => Bun.password.verify(password, bcryptHash)),
    ])

    return json({
      argon2id: { hashLength: argon2idHash.length, verifyMs: argon2idVerify },
      bcrypt: { hashLength: bcryptHash.length, verifyMs: bcryptVerify },
      note: "argon2id is memory-hard and the Bun default; bcrypt is CPU-hard and widely supported",
    })
  }

  return null
}

async function time(fn: () => Promise<unknown>): Promise<number> {
  const start = performance.now()
  await fn()
  return Math.round(performance.now() - start)
}
