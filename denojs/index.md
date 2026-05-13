# Deno POC

## What is Deno?

Deno is a secure JavaScript/TypeScript runtime built on V8, created by Ryan Dahl (Node.js creator) to fix Node's design mistakes. Deno 2.x ships as a single ~100MB binary with TypeScript support, a permission-based security model, a built-in toolchain (fmt, lint, test, bench, compile), and the JSR (JavaScript Registry) package ecosystem.

## Why Deno Matters

| Feature | Deno | Bun | Node |
|---------|------|-----|------|
| Runtime | V8 | JavaScriptCore | V8 |
| TypeScript | Built-in, zero config | Built-in | ts-node/tsx needed |
| Security | Default deny + permissions | Trust all | Trust all |
| Package registry | JSR + npm compat | npm | npm |
| SQLite | jsr:@db/sqlite | bun:sqlite (native) | better-sqlite3 |
| KV store | Deno.openKv() built-in | None | None |
| HTTP server | Deno.serve() | Bun.serve() | http module |
| WebSocket | Deno.upgradeWebSocket() | Bun.serve() ws | ws package |
| Crypto | Web Crypto API (full) | Web Crypto API | crypto module |
| Compression | CompressionStream (Web API) | Bun.gzipSync | zlib module |
| Workers | Web Workers (standard) | Web Workers | worker_threads |
| TCP sockets | Deno.listen/connect | Bun.listen/connect | net module |
| Process spawn | Deno.Command | Bun.spawn | child_process |
| Test runner | deno test | bun test | jest/vitest |
| Formatter | deno fmt | None built-in | prettier |
| Linter | deno lint | None built-in | eslint |
| Single binary | deno compile | bun compile | pkg (3rd party) |
| Benchmarks | deno bench | None built-in | benchmark.js |
| Cron (cloud) | Deno.cron() | None | None |

## Key Differentiators from Bun and Node

1. **Default-deny security** — `deno run main.ts` has NO permissions. Each capability must be explicitly granted (`--allow-net`, `--allow-read`, etc.). This is the opposite of Node/Bun trust-all models.

2. **Deno KV** — a built-in distributed key-value store with atomic transactions, real-time `watch()` streams, and SQLite-backed local storage. No Redis/memcached needed.

3. **JSR** — the JavaScript Registry (`jsr:` imports) is Deno's modern package registry with TypeScript-first packages, no npm-style `node_modules` directory, and content addressing.

4. **Web-standard APIs first** — Deno implements browser APIs before inventing its own. CompressionStream, fetch, WebSocket, crypto.subtle, and Workers are the same APIs as the browser. Code is portable across runtimes.

5. **deno compile** — single self-contained binary. Embed resources, cross-compile to other platforms.

6. **deno bench** — built-in benchmarking (`Deno.bench()`), produces nanosecond-precise timing without any dependencies.

## What This POC Covers

The app is a bare HTTP server (`Deno.serve()`) with 10 route modules, each demonstrating a Deno built-in API:

### `src/routes/tasks.ts` — REST API + WebSocket
- Full CRUD: GET, POST (single + bulk), PATCH, DELETE
- WebSocket pub/sub via `Deno.upgradeWebSocket()` and `BroadcastChannel`
- Backed by synchronous in-memory SQLite (`@db/sqlite`)

### `src/routes/files.ts` — File I/O
- `Deno.readDir()` for directory listing
- `Deno.open()` for streaming file downloads (no buffering)
- `Deno.writeFile()` for uploads
- Multipart form upload via native `req.formData()`

### `src/routes/kv.ts` — Deno KV (unique to Deno)
- `Deno.openKv()` — opens a local SQLite-backed KV store
- SET, GET, DELETE individual keys
- `kv.list({ prefix: [] })` — scan all entries
- `kv.atomic().set().commit()` — atomic multi-key transactions (all-or-nothing)
- `kv.watch([key])` — server-sent events stream on key changes

### `src/routes/process.ts` — Process Spawning
- `new Deno.Command(cmd, { stdout: "piped" })` — subprocess with captured I/O
- `.output()` — await completion
- `.spawn()` — get a child process for streaming stdout
- `Promise.all()` — parallel process execution
- `Deno.pid`, `Deno.build`, `Deno.mainModule`

### `src/routes/crypto.ts` — Web Crypto API
- `crypto.subtle.generateKey()` — AES-GCM-256, ECDSA P-256
- `crypto.subtle.encrypt/decrypt()` — AES-GCM round-trip with IV
- `crypto.subtle.sign/verify()` — ECDSA P-256 signature with tamper detection
- `crypto.subtle.importKey()` — HMAC-SHA256
- `crypto.subtle.digest()` — SHA-1/256/384/512 with timing comparison
- `crypto.randomUUID()` — RFC 4122 v4 UUIDs

### `src/routes/compress.ts` — Web Platform Compression
- `CompressionStream("gzip")` / `DecompressionStream("gzip")`
- `CompressionStream("deflate")` / `DecompressionStream("deflate")`
- `CompressionStream("deflate-raw")` — raw DEFLATE without header
- Streaming pipeline: ReadableStream → Transform → collect chunks
- Round-trip demo with compression ratios (text achieves ~6-7% of original size)

### `src/routes/worker.ts` — Web Workers
- `new Worker(import.meta.resolve("../workers/compute.ts"), { type: "module" })`
- CPU-intensive tasks off the main thread (fibonacci, primality, sum of primes)
- `Promise.all()` — 3 workers racing in parallel
- Clean terminate after task completes

### `src/routes/tcp.ts` — Raw TCP Sockets
- `Deno.listen({ port })` — TCP server with async connection loop
- `Deno.connect({ port })` — client connection
- Echo server: read → write back
- Burst test: 10 sequential round-trips with timing

### `src/routes/permissions.ts` — Security Model (unique to Deno)
- `Deno.permissions.query({ name })` — check current state of a capability
- All permission types: net, read, write, env, run, ffi, sys
- Returns state: "granted" | "prompt" | "denied"
- Shows the exact CLI flag and scoped grant syntax for each

### `src/routes/utils.ts` — System APIs
- `Deno.version` — deno, v8, typescript versions
- `Deno.env.get()` — environment variables
- `Deno.memoryUsage()` — RSS, heap total, heap used, external
- `Deno.hostname()` / `Deno.networkInterfaces()` — system info
- `performance.now()` / `performance.mark()` / `performance.measure()` — Web Performance API
- `structuredClone()` — deep clone benchmark (Web API, not a library)

## Running

```bash
cd app

# Run dev server with hot reload
deno task dev

# Run production server
deno task start

# Run all tests
deno task test

# Run benchmarks
deno task bench

# Compile to single binary
deno task compile
./denojs-poc
```

## Testing Routes

```bash
# Tasks
curl http://localhost:3000/tasks
curl -X POST http://localhost:3000/tasks -H 'Content-Type: application/json' -d '{"title":"learn deno"}'
curl -X POST http://localhost:3000/tasks -H 'Content-Type: application/json' -d '{"titles":["a","b","c"]}'
curl -X PATCH http://localhost:3000/tasks/1 -H 'Content-Type: application/json' -d '{"done":true}'
curl -X DELETE http://localhost:3000/tasks/1

# KV store
curl -X POST http://localhost:3000/kv -H 'Content-Type: application/json' -d '{"key":"greeting","value":"hello"}'
curl http://localhost:3000/kv/greeting
curl http://localhost:3000/kv
curl -X POST http://localhost:3000/kv/atomic -H 'Content-Type: application/json' -d '[{"key":"a","value":1},{"key":"b","value":2}]'

# Crypto
curl -X POST http://localhost:3000/crypto/aes -H 'Content-Type: application/json' -d '{"plaintext":"secret message"}'
curl -X POST http://localhost:3000/crypto/ecdsa -H 'Content-Type: application/json' -d '{"message":"sign this"}'
curl -X POST http://localhost:3000/crypto/digest -H 'Content-Type: application/json' -d '{"message":"hello deno"}'
curl http://localhost:3000/crypto/uuid

# Compression (web standard, ~93% ratio on repetitive text)
curl http://localhost:3000/compress/demo
curl -X POST http://localhost:3000/compress/gzip -H 'Content-Type: application/json' -d '{"text":"compress me please"}'

# Workers
curl -X POST http://localhost:3000/worker/compute -H 'Content-Type: application/json' -d '{"type":"fibonacci","n":40}'
curl http://localhost:3000/worker/race

# TCP
curl -X POST http://localhost:3000/tcp/echo -H 'Content-Type: application/json' -d '{"message":"ping"}'
curl http://localhost:3000/tcp/burst

# Permissions (Deno-exclusive security model)
curl http://localhost:3000/permissions
curl http://localhost:3000/permissions/net

# Process
curl http://localhost:3000/process/info
curl http://localhost:3000/process/spawn/parallel
curl -X POST http://localhost:3000/process/spawn -H 'Content-Type: application/json' -d '{"cmd":"date"}'

# Files
curl -X POST "http://localhost:3000/files?name=hello.txt" -d 'hello from deno'
curl http://localhost:3000/files
curl http://localhost:3000/files/hello.txt

# System utils
curl http://localhost:3000/utils/version
curl http://localhost:3000/utils/memory
curl http://localhost:3000/utils/sys
curl -X POST http://localhost:3000/utils/clone -H 'Content-Type: application/json' -d '{"iterations":100000}'
```

## WebSocket

```js
const ws = new WebSocket("ws://localhost:3000/ws");
ws.onmessage = (e) => console.log("event:", JSON.parse(e.data));
// Then create/update/delete tasks — events stream in real time
```

## Key Observations from Experiments

- **Compression ratios**: gzip 7.4%, deflate 6.6%, deflate-raw 6.2% on repetitive text — standard Web APIs match native library quality
- **KV watch** enables reactive patterns (SSE push on key change) with zero external infra
- **Permissions** can be granularly scoped: `--allow-net=api.example.com` instead of all-or-nothing
- **deno compile** produces a self-contained binary — no runtime needed on target machine
- **Web Worker API** is identical to browser Workers — same pattern works in both environments
- **`@db/sqlite`** uses FFI to the system SQLite, so it downloads a native dylib on first run (cached after)
- **BroadcastChannel** enables cross-isolate pub/sub without a message broker

## Architecture Insight

Deno's permission system makes the security surface explicit at startup. When running with `--allow-all` you see "granted" everywhere. In production you'd scope each permission to the minimum required path/host, making the program's capabilities self-documenting from its startup flags.

The JSR package ecosystem (`jsr:` imports) uses content-addressed caching — no `node_modules` directory, no `npm install`, packages cache on first download per machine. The import map in `deno.json` makes version pinning centralized.
