## Enhance JS

HTML-first full-stack web framework built on web standards. No VDOM. No virtual component lifecycle. No hydration bundle. Components are pure functions that return HTML strings — SSR is the only rendering path, client JS is optional progressive enhancement.

React/Svelte/Solid ship a runtime + a component model that runs in the browser.
Enhance ships no runtime. The "framework" runs on the server only. What the browser gets is plain HTML + Web Components if you opt in.

## Core Concepts

### Custom Elements (app/elements/)

File name = tag name: `app/elements/my-card.mjs` → `<my-card>`.
Export a function that receives `{ html, state }` and returns an HTML string.

```js
export default function MyCard({ html, state }) {
  const { attrs } = state
  const { title = 'Card' } = attrs
  return html`<div class="card"><h2>${title}</h2></div>`
}
```

Enhance SSR resolves nested custom elements recursively. `<my-card>` using `<my-badge>` inside its template: both are expanded server-side before the response is sent.

### State Flow

```
preflight.mjs → store (global)
api/page.mjs GET → store (page-scoped, merged)
element function → state.store, state.attrs
```

`state.attrs` = attributes from the HTML tag (e.g., `<my-card title="x">`).
`state.store` = data from API routes, merged into every element on that page.

### File-Based Routing

```
app/pages/counter.html → GET /counter (renders page)
app/api/counter.mjs   → GET/POST /counter (data + mutations)
```

API GET return value (`{ json: {...} }`) is merged into `state.store` before the page and its elements render.

### Styles

`<style>` inside an element is automatically scoped: selectors get the element tag prepended (`my-card .card { }` not `.card { }`). No CSS-in-JS, no CSS Modules, no shadow DOM required.

### Progressive Enhancement

Server renders a working HTML form. Client JS intercepts submit, does a fetch, patches DOM. Same element, same HTML — the JS upgrade is layered on top, not a replacement.

## Pros

- Zero JS required for baseline functionality
- View source shows real HTML — SEO, accessibility, screen readers just work
- No hydration mismatch errors (no client-side re-render)
- Elements are pure functions — trivially testable
- File-based routing with co-located API handlers
- Styles automatically scoped per element
- Web Component lifecycle available when JS interaction needed
- Deploy anywhere Node.js runs (Arc/AWS by default, but portable)

## Cons

- Not a SPA — multi-page app model (each nav is a server round-trip)
- Limited ecosystem compared to React/Vue
- No reactive state — client interactivity requires writing vanilla Web Component JS
- Arc/Architect coupling for routing and deployment config (`.arc` file)
- Module-level variables don't persist across requests (serverless model resets them)
- SSR-only means no client-side routing or optimistic UI without custom JS
- `html` tagged template escapes chars — building dynamic HTML via interpolation requires care

## Key Gotcha: SSR expands custom element tags

```html
<!-- What you write in the page: -->
<my-card title="Hello"></my-card>

<!-- What the browser receives (view source): -->
<my-card title="Hello" enhanced="✨">
  <div class="card"><h3>Hello</h3></div>
</my-card>
```

The custom element tag stays in the DOM as a wrapper (for Web Component upgrade hooks), but all content is pre-rendered. No flash of unstyled content, no layout shift on load.

## Key Gotcha: Serverless module scope

Enhance dev server mimics Lambda behavior — API route modules are re-imported per request. Module-level `let count = 0` resets on every call. Persistent state needs a real store (file, DB, session).

## Key Gotcha: No destructuring from html template

String interpolations inside `html\`...\`` that contain HTML are rendered as raw HTML (not escaped). Attribute values in element templates that come from user input should be sanitized before interpolation — Enhance doesn't auto-escape all interpolation contexts.

## What this POC demonstrates

1. **Custom Elements** (`/`): Four `<my-card>` elements with nested `<my-badge>`. View source — no `<my-card>` placeholders, real HTML. SSR resolves nested elements recursively.

2. **Progressive Enhancement** (`/counter`): Counter works via form POST with JS disabled (PRG pattern). With JS: form submit intercepted, fetch POST returns JSON, DOM updated in-place. Same element, no code branches.

3. **SSR + Data Flow** (`/data`): `api/data.mjs` GET handler returns framework list. Enhance merges it into `state.store`. `<my-framework-list>` reads store and renders `<table>` server-side. Zero client fetch required.

4. **Web Component Lifecycle** (`/lifecycle`): `observedAttributes`, `attributeChangedCallback`, `connectedCallback`. Attribute changes patch only the affected element's DOM nodes — no VDOM diff, no framework runtime.
