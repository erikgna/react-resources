function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  })
}

const FAST_ALGOS = ["wyhash", "crc32", "adler32", "cityHash32", "cityHash64", "xxHash32", "xxHash64", "xxHash3", "murmur32v3", "murmur32v2", "murmur64v2", "rapidhash"] as const
type FastAlgo = typeof FAST_ALGOS[number]

const CRYPTO_ALGOS = ["md5", "sha1", "sha256", "sha384", "sha512", "sha3-256", "blake2b512"] as const
type CryptoAlgo = typeof CRYPTO_ALGOS[number]

export async function handleHashing(req: Request): Promise<Response | null> {
  const url = new URL(req.url)
  const path = url.pathname

  // GET /hash/fast?input=hello&algo=wyhash
  // Bun.hash — non-cryptographic, extremely fast (Wyhash default)
  if (req.method === "GET" && path === "/hash/fast") {
    const input = url.searchParams.get("input") ?? "hello bun"
    const algo = (url.searchParams.get("algo") ?? "wyhash") as FastAlgo

    if (!FAST_ALGOS.includes(algo)) {
      return json({ error: `unknown algo. use: ${FAST_ALGOS.join(", ")}` }, 400)
    }

    const result = Bun.hash[algo](input)
    return json({
      input,
      algo,
      hash: result.toString(),
      note: "non-cryptographic — fast for hash maps, dedup, checksums. NOT for passwords or security.",
    })
  }

  // GET /hash/fast/all?input=hello — run all fast algos side by side
  if (req.method === "GET" && path === "/hash/fast/all") {
    const input = url.searchParams.get("input") ?? "hello bun"
    const results: Record<string, string> = {}
    for (const algo of FAST_ALGOS) {
      results[algo] = Bun.hash[algo](input).toString()
    }
    return json({ input, results })
  }

  // POST /hash/crypto — CryptoHasher, streaming updates
  if (req.method === "POST" && path === "/hash/crypto") {
    const body = await req.json<{ input?: string; algo?: string; encoding?: string }>()
    const input = body.input ?? "hello bun"
    const algo = (body.algo ?? "sha256") as CryptoAlgo
    const encoding = (body.encoding ?? "hex") as "hex" | "base64" | "base64url"

    if (!CRYPTO_ALGOS.includes(algo)) {
      return json({ error: `unknown algo. use: ${CRYPTO_ALGOS.join(", ")}` }, 400)
    }

    // Streaming update API — useful for large inputs
    const hasher = new Bun.CryptoHasher(algo)
    const parts = input.split(" ")
    for (let i = 0; i < parts.length; i++) {
      hasher.update(parts[i])
      if (i < parts.length - 1) hasher.update(" ")
    }
    const digest = hasher.digest(encoding)

    // One-shot static method for comparison
    const oneShot = Bun.CryptoHasher.hash(algo, input, encoding)

    return json({
      input,
      algo,
      encoding,
      streamingDigest: digest,
      oneShotDigest: oneShot,
      match: digest === oneShot,
      length: (digest as string).length,
    })
  }

  // GET /hash/compare?input=hello — benchmark all crypto algos
  if (req.method === "GET" && path === "/hash/compare") {
    const input = url.searchParams.get("input") ?? "benchmark this string"
    const results: Record<string, { digest: string; elapsedNs: number }> = {}

    for (const algo of CRYPTO_ALGOS) {
      const start = Bun.nanoseconds()
      const digest = Bun.CryptoHasher.hash(algo, input, "hex") as string
      const elapsed = Bun.nanoseconds() - start
      results[algo] = { digest: digest.slice(0, 16) + "…", elapsedNs: elapsed }
    }

    return json({ input, results })
  }

  return null
}
