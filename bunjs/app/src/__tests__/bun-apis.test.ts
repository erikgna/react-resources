import { describe, it, expect } from "bun:test"
import { join } from "path"

// ─── Bun.hash() ──────────────────────────────────────────────────────────────

describe("Bun.hash — non-cryptographic fast hashing", () => {
  const input = "hello bun"

  it("wyhash (default) returns a number", () => {
    const h = Bun.hash(input)
    expect(typeof h === "number" || typeof h === "bigint").toBe(true)
  })

  it("same input same hash (deterministic)", () => {
    expect(Bun.hash.wyhash(input)).toBe(Bun.hash.wyhash(input))
  })

  it("different inputs produce different hashes", () => {
    expect(Bun.hash.wyhash("aaa")).not.toBe(Bun.hash.wyhash("bbb"))
  })

  it("crc32 returns number", () => {
    expect(typeof Bun.hash.crc32(input)).toBe("number")
  })

  it("adler32 returns number", () => {
    expect(typeof Bun.hash.adler32(input)).toBe("number")
  })

  it("xxHash32 returns number", () => {
    expect(typeof Bun.hash.xxHash32(input)).toBe("number")
  })

  it("seed changes the hash value", () => {
    const noSeed = Bun.hash.wyhash(input, 0)
    const seeded = Bun.hash.wyhash(input, 12345)
    expect(noSeed).not.toBe(seeded)
  })
})

// ─── Bun.CryptoHasher ────────────────────────────────────────────────────────

describe("Bun.CryptoHasher", () => {
  it("sha256 hex digest is 64 chars", () => {
    const digest = Bun.CryptoHasher.hash("sha256", "hello", "hex")
    expect((digest as string).length).toBe(64)
  })

  it("md5 hex digest is 32 chars", () => {
    const digest = Bun.CryptoHasher.hash("md5", "hello", "hex")
    expect((digest as string).length).toBe(32)
  })

  it("streaming update matches one-shot", () => {
    const hasher = new Bun.CryptoHasher("sha256")
    hasher.update("hello")
    hasher.update(" ")
    hasher.update("world")
    const streaming = hasher.digest("hex")
    const oneShot = Bun.CryptoHasher.hash("sha256", "hello world", "hex")
    expect(streaming).toBe(oneShot)
  })

  it("same input different algos produce different digests", () => {
    const sha256 = Bun.CryptoHasher.hash("sha256", "test", "hex")
    const sha512 = Bun.CryptoHasher.hash("sha512", "test", "hex")
    expect(sha256).not.toBe(sha512)
  })

  it("base64 encoding differs from hex", () => {
    const hex = Bun.CryptoHasher.hash("sha256", "test", "hex")
    const b64 = Bun.CryptoHasher.hash("sha256", "test", "base64")
    expect(hex).not.toBe(b64)
  })
})

// ─── Bun.nanoseconds() ───────────────────────────────────────────────────────

describe("Bun.nanoseconds()", () => {
  it("returns a positive integer", () => {
    const ns = Bun.nanoseconds()
    expect(ns).toBeGreaterThan(0)
    expect(Number.isInteger(ns)).toBe(true)
  })

  it("increases monotonically", () => {
    const t1 = Bun.nanoseconds()
    // do a tiny bit of work
    let x = 0
    for (let i = 0; i < 1000; i++) x += i
    const t2 = Bun.nanoseconds()
    expect(t2).toBeGreaterThan(t1)
    expect(x).toBeGreaterThan(0) // prevent optimization
  })

  it("measures sub-millisecond intervals", () => {
    const start = Bun.nanoseconds()
    Bun.hash("tiny work")
    const elapsed = Bun.nanoseconds() - start
    expect(elapsed).toBeGreaterThan(0)
    expect(elapsed).toBeLessThan(1_000_000) // under 1ms for a hash
  })
})

// ─── Bun.gzip / gunzip / deflate / inflate ───────────────────────────────────

describe("Bun compression", () => {
  const enc = new TextEncoder()
  const dec = new TextDecoder()
  const text = "compress me! ".repeat(100)
  const data = enc.encode(text)

  it("gzipSync produces smaller output for repetitive data", () => {
    const compressed = Bun.gzipSync(data)
    expect(compressed.byteLength).toBeLessThan(data.byteLength)
  })

  it("gzip → gunzip round-trips correctly", () => {
    const compressed = Bun.gzipSync(data)
    const restored = Bun.gunzipSync(compressed)
    expect(dec.decode(restored)).toBe(text)
  })

  it("deflate → inflate round-trips correctly", () => {
    const compressed = Bun.deflateSync(data)
    const restored = Bun.inflateSync(compressed)
    expect(dec.decode(restored)).toBe(text)
  })

  it("deflate is smaller than gzip (no header overhead)", () => {
    const gzipped = Bun.gzipSync(data)
    const deflated = Bun.deflateSync(data)
    expect(deflated.byteLength).toBeLessThanOrEqual(gzipped.byteLength)
  })

  it("compression level affects output size", () => {
    const fast = Bun.gzipSync(data, { level: 1 })
    const best = Bun.gzipSync(data, { level: 9 })
    expect(best.byteLength).toBeLessThanOrEqual(fast.byteLength)
  })
})

// ─── Bun.escapeHTML() ────────────────────────────────────────────────────────

describe("Bun.escapeHTML()", () => {
  it("escapes <", () => expect(Bun.escapeHTML("<b>")).toBe("&lt;b&gt;"))
  it("escapes >", () => expect(Bun.escapeHTML("<b>bold</b>")).toContain("&gt;"))
  it("escapes &", () => expect(Bun.escapeHTML("a & b")).toBe("a &amp; b"))
  it('escapes "', () => expect(Bun.escapeHTML('"quoted"')).toBe("&quot;quoted&quot;"))
  it("escapes script tag", () => {
    const escaped = Bun.escapeHTML('<script>alert("xss")</script>')
    expect(escaped).not.toContain("<script>")
    expect(escaped).toContain("&lt;script&gt;")
  })
  it("leaves safe strings untouched", () => {
    expect(Bun.escapeHTML("hello world 123")).toBe("hello world 123")
  })
})

// ─── Bun.peek() ──────────────────────────────────────────────────────────────

describe("Bun.peek()", () => {
  it("returns value of a resolved Promise synchronously", () => {
    const p = Promise.resolve(42)
    expect(Bun.peek(p)).toBe(42)
  })

  it("returns the Promise itself when pending", () => {
    const p = new Promise<number>(() => {}) // never resolves
    expect(Bun.peek(p)).toBe(p)
  })

  it("peek.status reports 'fulfilled' for resolved", () => {
    const p = Promise.resolve("done")
    expect(Bun.peek.status(p)).toBe("fulfilled")
  })

  it("peek.status reports 'pending' for unresolved", () => {
    const p = new Promise(() => {})
    expect(Bun.peek.status(p)).toBe("pending")
  })

  it("peek.status reports 'rejected' for rejected", () => {
    const p = Promise.reject(new Error("oops"))
    p.catch(() => {}) // suppress unhandled
    expect(Bun.peek.status(p)).toBe("rejected")
  })
})

// ─── Bun.which() ─────────────────────────────────────────────────────────────

describe("Bun.which()", () => {
  it("finds bun binary", () => {
    const path = Bun.which("bun")
    expect(path).not.toBeNull()
    expect(path!).toContain("bun")
  })

  it("returns null for nonexistent command", () => {
    expect(Bun.which("this-command-does-not-exist-xyz")).toBeNull()
  })
})

// ─── Bun.spawn() ─────────────────────────────────────────────────────────────

describe("Bun.spawn()", () => {
  it("captures stdout from child process", async () => {
    const proc = Bun.spawn(["echo", "hello spawn"], { stdout: "pipe" })
    const text = await new Response(proc.stdout).text()
    expect(text.trim()).toBe("hello spawn")
  })

  it("returns exit code 0 on success", async () => {
    const proc = Bun.spawn(["bun", "--version"], { stdout: "pipe" })
    const exit = await proc.exited
    expect(exit).toBe(0)
  })

  it("returns non-zero exit code on failure", async () => {
    const proc = Bun.spawn(["ls", "/path/that/does/not/exist/xyz123"], {
      stdout: "ignore",
      stderr: "ignore",
    })
    const exit = await proc.exited
    expect(exit).not.toBe(0)
  })

  it("spawns multiple processes in parallel", async () => {
    const procs = [
      Bun.spawn(["echo", "a"], { stdout: "pipe" }),
      Bun.spawn(["echo", "b"], { stdout: "pipe" }),
      Bun.spawn(["echo", "c"], { stdout: "pipe" }),
    ]
    const outputs = await Promise.all(
      procs.map((p) => new Response(p.stdout).text())
    )
    expect(outputs.map((o) => o.trim())).toEqual(["a", "b", "c"])
  })
})

// ─── Worker ──────────────────────────────────────────────────────────────────

describe("Worker threads", () => {
  const WORKER_URL = new URL("../workers/compute.ts", import.meta.url).href

  function runWorker(type: string, n: number): Promise<number> {
    return new Promise((resolve, reject) => {
      const w = new Worker(WORKER_URL)
      w.onmessage = (e: MessageEvent<{ result: number }>) => {
        w.terminate()
        resolve(e.data.result)
      }
      w.onerror = (e) => { w.terminate(); reject(new Error(e.message)) }
      w.postMessage({ type, n })
    })
  }

  it("fibonacci(10) = 55", async () => {
    expect(await runWorker("fibonacci", 10)).toBe(55)
  })

  it("fibonacci(0) = 0", async () => {
    expect(await runWorker("fibonacci", 0)).toBe(0)
  })

  it("isPrime(7) = true", async () => {
    expect(await runWorker("isPrime", 7)).toBe(true)
  })

  it("isPrime(4) = false", async () => {
    expect(await runWorker("isPrime", 4)).toBe(false)
  })

  it("runs 3 workers in parallel", async () => {
    const [a, b, c] = await Promise.all([
      runWorker("fibonacci", 5),  // 5
      runWorker("fibonacci", 6),  // 8
      runWorker("fibonacci", 7),  // 13
    ])
    expect(a).toBe(5)
    expect(b).toBe(8)
    expect(c).toBe(13)
  })
})

// ─── Bun.FileSystemRouter ────────────────────────────────────────────────────

describe("Bun.FileSystemRouter", () => {
  const router = new Bun.FileSystemRouter({
    style: "nextjs",
    dir: join(import.meta.dir, "../pages"),
    fileExtensions: [".ts"],
  })

  it("has routes registered", () => {
    expect(Object.keys(router.routes).length).toBeGreaterThan(0)
  })

  it("matches exact route /", () => {
    const match = router.match("/")
    expect(match).not.toBeNull()
    expect(match!.kind).toBe("exact")
  })

  it("matches dynamic route /tasks/99", () => {
    const match = router.match("/tasks/99")
    expect(match).not.toBeNull()
    expect(match!.params).toEqual({ id: "99" })
  })

  it("matches dynamic slug /blog/my-post", () => {
    const match = router.match("/blog/my-post")
    expect(match).not.toBeNull()
    expect(match!.params).toEqual({ slug: "my-post" })
  })

  it("matches catch-all for unknown paths", () => {
    const match = router.match("/some/unknown/path")
    expect(match).not.toBeNull()
    expect(match!.kind).toBe("catch-all")
  })

  it("returns null for unmatched when no catch-all covers it — or matches catch-all", () => {
    // With a catch-all defined, nothing is truly 404 from router's perspective
    const match = router.match("/deeply/nested/route")
    // Either matched by catch-all or null — both valid depending on catch-all placement
    expect(match === null || match!.kind === "catch-all").toBe(true)
  })

  it("parses query string from match", () => {
    const match = router.match("/tasks/5?foo=bar&baz=qux")
    expect(match).not.toBeNull()
    expect(match!.query).toMatchObject({ foo: "bar", baz: "qux" })
    expect(match!.params).toEqual({ id: "5" })
  })
})
