# Guitar Factory System — Knowledge Index

## What this POC demonstrates

**OOAD Patterns in TypeScript/Next.js:**

| Pattern | Location | Key insight |
|---|---|---|
| Factory Method | `domain/factory.ts` | Abstract `GuitarFactory.produce()` delegates builder creation to subclass via `createBuilder()` |
| Builder | `domain/builder.ts` | Method chaining with `this` return type. `Object.freeze()` enforces immutability after `build()` |
| Observer | `domain/inventory.ts` | `subscribe()` returns unsubscribe function (closure pattern). Discriminated union for event types |
| Strategy | `domain/factory.ts` `selectFactory()` | Map-based dispatch replaces if/else chain. O(1) lookup |

## Next.js App Router internals observed

- Server Components (`inventory/page.tsx`) call service functions directly — no fetch needed server-side
- `force-dynamic` needed when server component reads from in-memory singleton that changes at runtime
- `"use client"` boundary required at hook consumption site, not at hook definition
- TanStack Query `QueryClient` must be created inside `useState` to avoid sharing across requests

## Surprising things

1. **In-memory singleton resets on hot-reload** — Next.js dev server restarts the module. The `try/catch` in `seed()` handles re-seeding collisions.
2. **`Object.freeze()` is shallow** — nested `spec` object needs its own `freeze()` call.
3. **Builder reuse is footgun** — same builder instance accumulates state. Factory always creates a new builder per `produce()` call.
4. **TanStack Query `staleTime: 0`** — required for inventory to always refetch after mutation invalidation.

## Failure paths explored

- `GuitarBuilder.build()` without all fields → explicit error with missing field names
- Mutating frozen `Guitar` object → TypeError in strict mode
- Adding duplicate guitar to inventory → explicit error
- Removing non-existent guitar → explicit error
- Observer after `unsubscribe()` → no longer receives events (closure cleanup)
