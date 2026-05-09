# Elysia JS

TypeScript HTTP framework built for Bun. End-to-end type safety without code generation.

## Core Idea

Elysia knows the shape of every route at compile time — request body, params, query, response.
Eden Treaty consumes that type on the client with zero runtime overhead.
No OpenAPI codegen. No Zod schema duplication. One source of truth.

## vs Other Frameworks

| | Elysia | Express | Hono | Fastify |
|---|---|---|---|---|
| Runtime | Bun | Node | Any | Node |
| Type safety | End-to-end (Eden) | Manual | Partial | Manual |
| Validation | TypeBox built-in | zod/manual | zod/validator | ajv |
| Plugin API | Scoped + named | Middleware | Middleware | Plugin |
| WebSocket | Built-in | ws pkg | Adapter | ws pkg |
| Perf (req/s) | ~250k | ~15k | ~200k | ~80k |

## Key Concepts

### Plugin
`new Elysia({ name: 'auth' })` — deduped by name across the app.
`.derive()` injects properties into every route's context that uses the plugin.
Plugins compose — a plugin can use other plugins.

### Schema (TypeBox)
TypeBox schemas serve dual purpose: runtime validation + TypeScript types.
`t.Object({ name: t.String() })` generates both the validator AND the `{ name: string }` type.
Elysia rejects invalid requests before handlers run.

### Lifecycle
```
Request → onRequest → parse → beforeHandle → handle → afterHandle → Response
                                                          ↓ (on error)
                                                       onError
```

### Guard
`.guard()` applies beforeHandle/schema to a scoped group of routes without a URL prefix.
Different from `.group()` which is prefix-only.

### Eden Treaty
```ts
const api = treaty<App>('http://localhost:3000')
const { data, error } = await api.users.get()
// data is typed as User[] — inferred from the route definition
```
No `any`. No casting. The server type IS the client type.

## Pros
- Fastest TypeScript HTTP framework on Bun benchmarks
- True end-to-end types — server shape === client shape via Eden
- Plugin deduplication — safe to use a plugin in multiple places
- Built-in Swagger generation from TypeBox schemas
- WebSocket, SSE, and static file serving built-in
- Lifecycle hooks are typed — access to full ctx including derived fields

## Cons
- Bun-first — Node.js support exists but not the focus
- Eden Treaty requires both client and server in TypeScript
- Smaller ecosystem than Express/Fastify
- Some Bun-specific behavior (e.g., Bun.file, Bun.serve) doesn't map 1:1 to Node
- Plugin ordering can cause subtle type errors if derived fields are used before plugin is registered
- WebSocket handler types can be verbose

## What This POC Exercises

1. **Schema validation** — TypeBox shapes on body/params/query, invalid input behavior
2. **Plugin architecture** — `derive()` for auth context injection
3. **Lifecycle hooks** — `onRequest`, `beforeHandle`, `afterHandle`, `onError`
4. **Guards** — scoped auth without URL prefix
5. **Route groups** — `.group('/users')`, `.group('/products')`
6. **Eden Treaty** — type-safe client with inferred response types
7. **WebSocket** — chat endpoint with `open`/`message`/`close` handlers
