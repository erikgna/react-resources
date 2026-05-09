# Astro JS POC

## Core Concept: Islands Architecture

Astro renders pages as static HTML by default. Zero JS ships to the browser unless you explicitly opt in.
Interactive UI pieces are "islands" — isolated React/Vue/Svelte components hydrated on demand.

```
┌──────────────────────── Page (static HTML) ──────────────────────────┐
│  <header>...</header>           ← pure HTML, 0 JS                    │
│  <StaticList />                 ← SSR'd, 0 JS                        │
│  <ReactCounter client:load />   ← island, hydrated on load           │
│  <ReactTicker client:visible /> ← island, hydrated when scrolled in  │
│  <footer>...</footer>           ← pure HTML, 0 JS                    │
└───────────────────────────────────────────────────────────────────────┘
```

## Hydration Directives

| Directive         | When hydrates           | Use case                          |
|-------------------|-------------------------|-----------------------------------|
| `client:load`     | Immediately on load     | Critical UI, above the fold       |
| `client:idle`     | After page is idle      | Non-critical interactive widgets  |
| `client:visible`  | When scrolled into view | Below-fold content                |
| `client:only`     | Client-only, no SSR     | Browser-API dependent components  |
| *(none)*          | Never (static HTML)     | Static content, no interactivity  |

## Astro Component vs React Island

Astro `.astro` files:
- Run only at build time (SSG) or request time (SSR)
- No client-side JS
- Can use `---` frontmatter to fetch data, import utils
- Cannot have state or event handlers

React `.tsx` islands:
- Full React component with hooks, state, effects
- Hydrated on client based on `client:*` directive
- Each island is isolated — no shared React tree
- Larger JS payload per island

## What this POC covers

1. **Islands tab** — Static Astro counter (dead HTML) vs React island counter (interactive)
2. **Hydration tab** — Same component with `client:load`, `client:idle`, `client:visible`, `client:only` side by side
3. **List tab** — SSR static list vs React island list with stress test
4. **Content tab** — Type-safe content collections (markdown → typed schema, validated at build time)
5. **Slots tab** — Named + default slots in `.astro` components with fallback content; `Astro.slots.has()`
6. **Stores tab** — nanostores `atom` + `computed` shared across two isolated React islands (cross-island state)
7. **Routing tab** — File-based routing, dynamic `[slug]` routes via `getStaticPaths`, API routes, View Transitions

## File-based Routing

```
src/pages/
  index.astro          →  /
  about.astro          →  /about
  posts/[slug].astro   →  /posts/:slug  (getStaticPaths)
  api/posts.json.ts    →  /api/posts.json  (static JSON at build time)
```

Dynamic routes call `getStaticPaths()` to enumerate all valid params at build time.
API routes (`*.ts` files) in static mode are pre-rendered as static files.

## View Transitions

Add `<ViewTransitions />` from `astro:transitions` to any page's `<head>`.
Astro intercepts navigation, animates shared elements with matching `transition:name` attributes.
No JS bundle change — uses the browser View Transitions API with Astro's polyfill.

## Cross-Island State (nanostores)

Islands are isolated by design. To share state across islands:
- Use `nanostores` atoms — framework-agnostic pub/sub
- `atom(0)` — writable atom
- `computed($atom, fn)` — derived read-only value
- `useStore($atom)` — React hook from `@nanostores/react`

No global React context, no prop drilling, no full SPA required.

## Slots

Astro `.astro` components can define:
- `<slot />` — default slot (unnamed)
- `<slot name="header" />` — named slot
- Fallback content inside `<slot>fallback</slot>`
- `Astro.slots.has("name")` — check if slot was provided before rendering its wrapper

Zero JS. Entire composition resolves at build time.

## Key Insights

- **Static > Islands**: Prefer static Astro components unless you actually need interactivity.
- **Directive matters**: `client:visible` cuts initial JS budget for below-fold content.
- **Islands are isolated**: React islands don't share state — cross-island needs a store.
- **SSR list is fast**: Static `<ul>` renders instantly, no hydration cost.
- **API routes are static**: In `output: "static"` mode, API routes generate pre-rendered files.
- **Slots are zero-cost**: Unlike React children, slots resolve at build time with no JS.

## Pros
- Near-zero JS by default
- Bring your own framework (React, Vue, Svelte, Solid all on one page)
- Content collections give type-safe markdown at build time
- File-based routing with dynamic routes and API routes
- View Transitions for SPA-like navigation without a full SPA
- Slots for build-time composition

## Cons
- Islands don't share state — cross-island communication needs a store (nanostores)
- `client:only` skips SSR entirely — breaks SEO for those components
- Not ideal for highly interactive SPAs (use Next.js / Remix instead)
- Learning curve around when to use `.astro` vs `.tsx`
- View Transitions limited to browsers supporting the API (+ Astro polyfill)
