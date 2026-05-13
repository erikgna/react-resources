const enc = new TextEncoder()
const dec = new TextDecoder()

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  })
}

function toBase64(buf: Uint8Array): string {
  return Buffer.from(buf).toString("base64")
}

function fromBase64(s: string): Uint8Array {
  return new Uint8Array(Buffer.from(s, "base64"))
}

export async function handleCompress(req: Request): Promise<Response | null> {
  const url = new URL(req.url)
  const path = url.pathname

  // GET /compress/demo — round-trip gzip + deflate on a fixed string
  if (req.method === "GET" && path === "/compress/demo") {
    const input = "Bun has built-in gzip, gunzip, deflate, and inflate — no zlib dep needed. "
      .repeat(10)

    const inputBytes = enc.encode(input)

    const gzipped = Bun.gzipSync(inputBytes)
    const deflated = Bun.deflateSync(inputBytes)
    const gunzipped = Bun.gunzipSync(gzipped)
    const inflated = Bun.inflateSync(deflated)

    return json({
      originalBytes: inputBytes.length,
      gzipBytes: gzipped.length,
      deflateBytes: deflated.length,
      gzipRatio: (gzipped.length / inputBytes.length).toFixed(3),
      deflateRatio: (deflated.length / inputBytes.length).toFixed(3),
      roundTripGzip: dec.decode(gunzipped) === input,
      roundTripDeflate: dec.decode(inflated) === input,
      note: "gzip = deflate + header/checksum. deflate is smaller for raw use.",
    })
  }

  // POST /compress/gzip — compress text body, return base64
  if (req.method === "POST" && path === "/compress/gzip") {
    const body = await req.json<{ text?: string; level?: number }>()
    if (!body.text) return json({ error: "text required" }, 400)

    const data = enc.encode(body.text)
    const compressed = Bun.gzipSync(data, { level: body.level ?? 6 })

    return json({
      originalBytes: data.length,
      compressedBytes: compressed.length,
      ratio: (compressed.length / data.length).toFixed(3),
      base64: toBase64(compressed),
    })
  }

  // POST /compress/gunzip — decompress base64-encoded gzip
  if (req.method === "POST" && path === "/compress/gunzip") {
    const body = await req.json<{ base64?: string }>()
    if (!body.base64) return json({ error: "base64 required" }, 400)

    const compressed = fromBase64(body.base64)
    const decompressed = Bun.gunzipSync(compressed)
    return json({ text: dec.decode(decompressed), bytes: decompressed.length })
  }

  // POST /compress/deflate — raw deflate (no gzip header)
  if (req.method === "POST" && path === "/compress/deflate") {
    const body = await req.json<{ text?: string }>()
    if (!body.text) return json({ error: "text required" }, 400)

    const data = enc.encode(body.text)
    const compressed = Bun.deflateSync(data)
    return json({
      originalBytes: data.length,
      compressedBytes: compressed.length,
      base64: toBase64(compressed),
    })
  }

  // POST /compress/inflate — decompress raw deflate
  if (req.method === "POST" && path === "/compress/inflate") {
    const body = await req.json<{ base64?: string }>()
    if (!body.base64) return json({ error: "base64 required" }, 400)

    const compressed = fromBase64(body.base64)
    const decompressed = Bun.inflateSync(compressed)
    return json({ text: dec.decode(decompressed), bytes: decompressed.length })
  }

  return null
}
