# Bun

All-in-one JavaScript toolchain: runtime, bundler, package manager, and test runner — built from scratch in Zig.

## Core Idea

Bun replaces Node.js + npm + webpack + Jest with a single binary. Every tool shares the same engine (JavaScriptCore instead of V8), the same module resolver, and the same native API surface. The result: startup time 4x faster than Node, `bun install` 25x faster than npm, and built-in APIs that eliminate most dependencies.

## vs Node.js

| | Bun | Node.js |
|---|---|---|
| Runtime | JavaScriptCore (Safari) | V8 (Chrome) |
| Startup | ~5ms | ~50ms |
| HTTP server | `Bun.serve()` built-in | `http` module |
| SQLite | `bun:sqlite` built-in | `better-sqlite3` dep |
| Test runner | `bun test` built-in | Jest / Vitest dep |
| Bundler | `bun build` built-in | webpack / esbuild dep |
| Shell scripting | `$` tagged template built-in | `execa` / `child_process` |
| Password hashing | `Bun.password` built-in | `bcrypt` / `argon2` dep |
| Package manager | `bun install` (25x faster) | npm / yarn / pnpm |
| Node compat | ~95% (most npm pkgs work) | 100% |

## Key APIs

### Bun.serve()
```ts
Bun.serve({
  port: 3000,
  fetch(req) { return new Response("ok") },
  websocket: {
    open(ws) { ws.subscribe("room") },
    message(ws, data) { ws.publish("room", data) },
    close(ws) { }
  }
})
```
WebSocket is first-class — no separate `ws` package. Same server handles both HTTP and WS.

### bun:sqlite
```ts
import { Database } from "bun:sqlite"
const db = new Database(":memory:")
db.run("CREATE TABLE tasks (id INTEGER PRIMARY KEY, title TEXT)")
const insert = db.prepare("INSERT INTO tasks (title) VALUES ($title)")
insert.run({ $title: "build something" })
const all = db.query("SELECT * FROM tasks").all()
```
Synchronous API. No async overhead. Prepared statements reuse query plans.

### Bun.file()
```ts
const file = Bun.file("./data.json")
const text = await file.text()
const json = await file.json()
// Lazy — no I/O until you call text/json/arrayBuffer/stream
await Bun.write("./output.txt", "hello")
```
`Bun.file()` is lazy — metadata only. I/O happens on consume. Stream directly as `Response` body without buffering.

### Bun Shell
```ts
import { $ } from "bun"
const output = await $`ls -la`.text()
const files = await $`find . -name "*.ts"`.lines()
const json = await $`cat package.json`.json()
await $`mkdir -p dist && cp src/*.ts dist/`
```
Cross-platform. Globs, pipes, and env vars work natively.

### Bun.password
```ts
const hash = await Bun.password.hash("secret")          // argon2id by default
const match = await Bun.password.verify("secret", hash)  // boolean
const bcryptHash = await Bun.password.hash("secret", "bcrypt")
```
argon2id default, bcrypt supported. No native module compilation.

### bun:test
```ts
import { describe, it, expect, beforeAll } from "bun:test"

describe("tasks", () => {
  it("creates a task", () => {
    expect(createTask("test")).toEqual({ id: 1, title: "test" })
  })
})
```
Jest-compatible API. Run with `bun test`. Watch mode: `bun test --watch`.

## Lifecycle of Bun.serve()

```
Request
  → fetch(req, server) handler
      → manual URL dispatch
      → Response (sync or async)

WebSocket upgrade:
  → fetch() calls server.upgrade(req)
  → websocket.open(ws)
  → websocket.message(ws, data)
  → websocket.close(ws)
```

## Pros
- Single binary replaces Node + npm + webpack + Jest + esbuild
- Cold start 4-10x faster than Node.js (matters for serverless/CLI)
- `bun:sqlite` is the fastest SQLite binding in JS ecosystem
- `Bun.file()` streams without buffering — memory efficient for large files
- Bun Shell eliminates cross-platform `execa` / `child_process` juggling
- Built-in TypeScript — no `ts-node` or compilation step needed
- Hot reload (`bun --hot`) restarts only changed modules, keeps state in unchanged ones
- npm compatibility — most Node.js packages work without changes

## Cons
- JavaScriptCore instead of V8 — subtle behavior differences in edge cases
- ~5% of Node.js APIs not yet implemented (mostly niche OS-level stuff)
- Windows support lagging behind macOS/Linux
- `bun:sqlite` synchronous API — intentional but unusual for JS devs
- `Bun.serve()` lacks Express-style middleware chaining (use Elysia/Hono on top)
- FFI and plugin APIs still maturing
- Not all npm packages with native modules compile correctly

## What This POC Exercises

1. **`Bun.serve()`** — bare HTTP server with manual URL routing, no framework (`src/index.ts`)
2. **WebSocket** — pub/sub task notifications via `ws.publish()` / `ws.subscribe()` (`src/index.ts`)
3. **`bun:sqlite`** — in-memory DB, prepared statements, transactions (`src/db.ts`)
4. **CRUD routes** — tasks API backed by SQLite, full lifecycle (`src/routes/tasks.ts`)
5. **`Bun.file()`** — lazy file reads, streaming responses, `Bun.write()` (`src/routes/files.ts`)
6. **Bun Shell `$`** — run shell commands, capture output, pipe results (`src/routes/shell.ts`)
7. **`Bun.password`** — hash + verify with argon2id and bcrypt (`src/routes/auth.ts`)
8. **`bun:test`** — Jest-compatible test runner, describe/it/expect, beforeAll (`src/__tests__/tasks.test.ts`)
9. **Hot reload** — `bun --hot` for dev; module-level state persists across reloads
10. **TypeScript native** — no build step, `bun src/index.ts` runs `.ts` directly

## Bun.serve() vs Node http.createServer()

| | Bun.serve() | http.createServer() |
|---|---|---|
| WebSocket | Built-in | Separate `ws` package |
| TLS | `tls: { cert, key }` option | Separate `https` module |
| Static files | `Bun.file()` as response | `fs.createReadStream()` |
| Upgrade | `server.upgrade(req)` | Manual header juggling |
| Perf (req/s) | ~200k | ~40k |

## bun:sqlite vs better-sqlite3

| | bun:sqlite | better-sqlite3 |
|---|---|---|
| Install | Zero (built-in) | npm install + native compile |
| API | Synchronous | Synchronous |
| Speed | ~2x faster | Baseline |
| Prepared stmts | `db.prepare()` | `db.prepare()` |
| Transactions | `db.transaction(() => {})` | `db.transaction(() => {})` |
| In-memory | `new Database(":memory:")` | `new Database(":memory:")` |
