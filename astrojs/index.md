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

## What this POC explores

1. **Islands tab** — Static Astro counter (broken/dead) vs React island counter (interactive)
2. **Hydration tab** — Same component with `client:load`, `client:idle`, `client:visible` side by side
3. **List tab** — SSR static list vs React island list with stress test (same as milionjs ReactList)
4. **Content tab** — Type-safe content collections (markdown → typed schema)

## Key insights

Static > Islands: Prefer static Astro components unless you actually need interactivity.
Directive matters: `client:visible` can cut initial JS budget significantly for below-fold content.
Islands are isolated: React islands don't share state — no global React context across islands.
SSR list is fast: Static `<ul>` renders instantly, no hydration cost. But you can't stress-test it.

## Pros
- Near-zero JS by default
- Bring your own framework (React, Vue, Svelte, Solid all on one page)
- Content collections give type-safe markdown at build time
- Excellent for content-heavy sites, blogs, docs, marketing

## Cons
- Islands don't share state — cross-island communication needs a store (nanostores)
- `client:only` skips SSR entirely — breaks SEO for those components  
- Not ideal for highly interactive SPAs (use Next.js / Remix instead)
- Learning curve around when to use `.astro` vs `.tsx`
