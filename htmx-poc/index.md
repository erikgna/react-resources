# HTMX POC

## What

Deep exploration of HTMX — a hypermedia-driven library that extends HTML with AJAX, SSE, and WebSocket attributes. No JavaScript in consuming code. Server returns HTML fragments, not JSON.

## Stack

- Bun runtime + Hono HTTP framework
- Plain HTML + HTMX (served from local `public/htmx.js`)
- No React, no bundler, no template engine

## Run

```bash
cd htmx-poc
bun install
bun src/server.ts
# → http://localhost:3001
```

## Experiments

| # | Route | What |
|---|---|---|
| 01 | /experiments/basics | hx-get/post/put/delete, HX-* headers |
| 02 | /experiments/swaps | All 8 hx-swap modes + DOM settlement |
| 03 | /experiments/triggers | Event modifiers: delay, throttle, once, from, intersect, every |
| 04 | /experiments/oob | hx-swap-oob multi-target atomic response |
| 05 | /experiments/indicators | hx-indicator CSS lifecycle |
| 06 | /experiments/history | hx-push-url, back button, localStorage cache |
| 07 | /experiments/sse | SSE extension, reconnect behavior |
| 08 | /experiments/ws | WS extension, bidirectional |
| 09 | /experiments/extensions | hx-boost, json-enc, preload |
| 10 | /experiments/failures | All failure modes: 4xx/5xx, race, CSP, malformed HTML |

## Key Source Functions (read these)

| Function | File | What |
|---|---|---|
| `processNode` | htmx.js | Scans DOM, wires hx-* attributes |
| `issueAjaxRequest` | htmx.js | Core XHR dispatch |
| `handleAjaxResponse` | htmx.js | Parses response, triggers swap |
| `swap` | htmx.js | Routes to correct swap strategy |
| `settleImmediately` | htmx.js | Removes .htmx-settling after transition |
| `boostElement` | htmx.js | How boost intercepts links/forms |

## Mini-HTMX

`src/core/mini-htmx.ts` — hand-rolled ~100-line HTMX subset. Repeat from memory ×10.

## Observability

`htmx.logAll()` is active on every page. Open DevTools console.

Key events: `htmx:beforeRequest`, `htmx:afterSwap`, `htmx:afterSettle`, `htmx:responseError`, `htmx:sendError`
