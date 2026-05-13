import { handleTasks } from "./routes/tasks"
import { handleFiles } from "./routes/files"
import { handleShell } from "./routes/shell"
import { handleAuth } from "./routes/auth"
import { handleHashing } from "./routes/hashing"
import { handleProcess } from "./routes/process"
import { handleCompress } from "./routes/compress"
import { handleUtils } from "./routes/utils"
import { handleWorker } from "./routes/worker"
import { handleTcp } from "./routes/tcp"
import { handleFsRouter } from "./routes/fsrouter"

const PORT = 3000

const server = Bun.serve({
  port: PORT,

  async fetch(req, server) {
    const url = new URL(req.url)

    // WebSocket upgrade at /ws
    if (url.pathname === "/ws") {
      const ok = server.upgrade(req)
      return ok ? undefined : new Response("WebSocket upgrade failed", { status: 400 })
    }

    const handlers = [
      handleTasks,
      handleFiles,
      handleShell,
      handleAuth,
      handleHashing,
      handleProcess,
      handleCompress,
      handleUtils,
      handleWorker,
      handleTcp,
      handleFsRouter,
    ]

    for (const handler of handlers) {
      const res = await handler(req, server)
      if (res) return res
    }

    if (req.method === "GET" && url.pathname === "/") {
      return new Response(ROUTE_INDEX, {
        headers: { "Content-Type": "application/json" },
      })
    }

    return new Response("not found", { status: 404 })
  },

  websocket: {
    open(ws) {
      ws.subscribe("tasks")
      ws.send(JSON.stringify({ event: "connected", message: "subscribed to task events" }))
    },
    message(ws, data) {
      ws.send(JSON.stringify({ event: "echo", data, at: new Date().toISOString() }))
    },
    close(ws) {
      ws.unsubscribe("tasks")
    },
  },
})

console.log(`Bun ${Bun.version} server running at http://localhost:${PORT}`)
console.log(`WebSocket at ws://localhost:${PORT}/ws`)

const ROUTE_INDEX = JSON.stringify(
  {
    runtime: `Bun ${Bun.version}`,
    routes: {
      tasks: {
        "GET /tasks": "list all tasks",
        "POST /tasks": "create { title } or bulk { titles: [] }",
        "GET /tasks/:id": "get task",
        "PATCH /tasks/:id": "update { done: boolean }",
        "DELETE /tasks/:id": "delete task",
      },
      files: {
        "GET /files": "list uploaded files",
        "GET /files/:name": "stream file (lazy Bun.file(), no buffer)",
        "POST /files": "upload multipart or raw (?name=)",
        "DELETE /files/:name": "delete file",
      },
      shell: {
        "GET /shell/info": "system info via Bun Shell $`...`",
        "GET /shell/files": "find .ts files via $`find`",
        "GET /shell/build": "Bun.build() and return output sizes",
        "POST /shell/run": "run allowlisted command { cmd }",
      },
      auth: {
        "POST /auth/hash": "Bun.password.hash { password, algorithm? }",
        "POST /auth/verify": "Bun.password.verify { password, hash }",
        "GET /auth/compare": "argon2id vs bcrypt benchmark",
      },
      hashing: {
        "GET /hash/fast": "Bun.hash() wyhash/crc32/adler32/xxhash/?input=&algo=",
        "GET /hash/fast/all": "all fast algos side-by-side ?input=",
        "POST /hash/crypto": "Bun.CryptoHasher sha256/md5/blake2b512 { input, algo, encoding }",
        "GET /hash/compare": "benchmark all crypto algos ?input=",
      },
      process: {
        "GET /process/timing": "Bun.nanoseconds() high-res benchmark",
        "GET /process/info": "pid, version, revision, uptime",
        "POST /process/spawn": "Bun.spawn() { cmd: string[] }",
        "GET /process/spawn/parallel": "spawn 3 processes simultaneously",
      },
      compress: {
        "GET /compress/demo": "gzip+deflate round-trip with ratio stats",
        "POST /compress/gzip": "Bun.gzipSync { text, level? } → base64",
        "POST /compress/gunzip": "Bun.gunzipSync { base64 } → text",
        "POST /compress/deflate": "Bun.deflateSync { text } → base64",
        "POST /compress/inflate": "Bun.inflateSync { base64 } → text",
      },
      utils: {
        "GET /utils/escape": "Bun.escapeHTML() ?html=",
        "GET /utils/peek": "Bun.peek() + Bun.peek.status() on resolved/pending/rejected",
        "GET /utils/which": "Bun.which() ?cmd=bun,node,git",
        "GET /utils/version": "Bun.version, revision, main, uptime",
      },
      worker: {
        "POST /worker/compute": "Worker thread { type: fibonacci|isPrime|sumPrimes, n }",
        "GET /worker/race": "3 workers in parallel (fib, prime check, sum primes)",
      },
      tcp: {
        "GET /tcp/info": "TCP echo server metadata",
        "POST /tcp/echo": "Bun.connect() round-trip { message }",
        "GET /tcp/burst": "10 sequential TCP round-trips",
      },
      router: {
        "GET /router/routes": "FileSystemRouter route table from pages/",
        "GET /router/match": "match a path ?path=/tasks/42&qs=foo=bar",
        "GET /router/demo": "resolve 5 example URLs through FSRouter",
      },
      ws: {
        "ws://localhost:3000/ws": "subscribe to task events (create/update/delete)",
      },
    },
  },
  null,
  2
)
