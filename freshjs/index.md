## Fresh JS

Deno's full-stack web framework. Server-renders everything by default. Ships zero client JS unless you opt in per component via the islands architecture.

## Islands Architecture

Fresh's defining concept. Components are either:
- **SSR-only** (`components/`, route JSX) — rendered to HTML on the server. No JS bundle shipped. Zero hydration cost.
- **Islands** (`islands/`) — hydrated on the client. Fresh ships a small JS chunk only for island components.

React: entire app hydrates on the client (unless you use RSC).  
SolidJS: entire app runs on client; signals patch DOM surgically.  
Fresh: most of the page is pure HTML. Only opted-in islands get JS.

## Reactivity Model

Islands use **Preact Signals** (`@preact/signals`). Same primitives as SolidJS signals but within Preact's component model:

| Primitive | SolidJS | Fresh/Preact |
|-----------|---------|-------------|
| Atom | `createSignal` | `signal()` / `useSignal()` |
| Derived | `createMemo` | `computed()` |
| Side effect | `createEffect` | `effect()` |
| Async data | `createResource` | manual fetch + `useSignal` |
| List | `<For>` | `<For>` (Preact) or `.map()` |

Key difference: SolidJS components run **once** — signals drive all updates from the start. Preact components re-render like React, but signals short-circuit the VDOM diff for subscribed nodes.

## Routing

File-based. Route files in `routes/`:
- Default export → Preact component (the page)
- `handler` export → server-side GET/POST logic

```ts
export const handler: Handlers<Data> = {
  GET(req, ctx) { return ctx.render(data); },
  async POST(req) { /* handle form/API */ },
};
export default function Page({ data }: PageProps<Data>) { ... }
```

No separate API layer needed. Handler and page are co-located.

## Shared Signals Across Islands

Two islands can share state without Context, Provider, or global stores. Export a signal from a shared module; both islands import it. JS module identity guarantees same instance on the client.

```ts
// shared/signals.ts
export const counter = signal(0);

// islands/A.tsx — writes
import { counter } from "../shared/signals.ts";
counter.value++;

// islands/B.tsx — reads  
import { counter } from "../shared/signals.ts";
// counter.value is live, updates when A writes
```

## Pros
- Zero JS by default — fastest possible initial load, great Lighthouse scores
- Server-first mental model — no hydration bugs, no client/server mismatch
- Co-located route handlers — no separate Express/API layer
- Deno native — TypeScript without a build step, built-in security
- Preact Signals — fine-grained reactivity in islands, no VDOM overhead for subscribed nodes
- Simple deployment — `deno deploy` or any Deno runtime

## Cons
- Islands only — can't share stateful Preact components freely across the tree without making them islands
- Deno ecosystem — npm compatibility is good but not perfect; some packages need wrapping
- Less ecosystem than React or Next.js
- Shared signals across islands require careful module path discipline
- No React DevTools; Preact DevTools exist but less mature
- SSR handler pattern unfamiliar to pure-SPA developers

## Key Gotchas

**`IS_BROWSER`**: code in islands runs on both server (SSR) and client (hydration). Use `IS_BROWSER` from `$fresh/runtime.ts` to guard client-only code.

**Don't put DOM access outside `useEffect`**: same rule as React — island code runs on server first.

**Shared signal module path must be exact**: both islands must import from the same resolved path. Any mismatch = separate signal instances = no shared state.

**`useSignal` vs `signal`**: `useSignal` is Preact hook syntax (component-scoped). `signal` at module level is shared across all renders.

**fresh.gen.ts must be kept in sync**: this file is auto-generated during `deno task start`. If you add a new island or route, Fresh regenerates it. Check it in.

## What This POC Demonstrates

1. **Islands tab**: `IslandCounter` island vs pure SSR content. Server timestamp vs client timestamp. `IS_BROWSER` check. DevTools-verifiable zero JS for non-island elements.

2. **Signals tab**: `signal` + `effect` for a 60fps RAF loop. `computed` for `fib(N)` with unrelated clock tick (computed does NOT rerun on tick). `effect` cleanup/dispose pattern.

3. **Server Handler tab**: `handler` in `routes/index.tsx` fetches initial items server-side before render. `routes/api/items.ts` handles GET/POST as a standalone API endpoint. `ServerDemo` island does client fetch to same endpoint.

4. **Shared State tab**: `SharedSignalA` and `SharedSignalB` both import `sharedMessage` and `sharedCounter` from `shared/signals.ts`. Typing in A updates B live. No props. No context. Module identity.
