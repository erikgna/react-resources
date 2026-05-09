---
title: "Astro Client Directives Deep Dive"
date: 2024-02-03
tags: ["astro", "hydration", "performance"]
draft: false
---

# Client Directives

Astro's `client:*` directives control *when* and *how* a component is hydrated on the client.

## client:load

```astro
<MyComponent client:load />
```

Hydrates immediately when the page loads. The component's JS is included in the critical bundle. Use this for UI that must be interactive right away — primary navigation, auth forms, anything above the fold.

**Cost:** adds to initial JS payload.

## client:idle

```astro
<MyComponent client:idle />
```

Hydrates once the browser becomes idle (`requestIdleCallback`). Falls back to `setTimeout` in browsers without `requestIdleCallback`. Good for secondary widgets that don't need to be ready immediately.

**Cost:** slight delay before interactive, but reduces initial load burden.

## client:visible

```astro
<MyComponent client:visible />
```

Uses `IntersectionObserver`. JS only downloads when the component scrolls into view. Ideal for carousels, comment sections, or anything below the fold.

**Cost:** may feel slow to hydrate if user scrolls fast. Add a preload hint if needed.

## client:only

```astro
<MyComponent client:only="react" />
```

Skips SSR entirely. The component doesn't appear in the server-rendered HTML. Required for components that use browser-only APIs (`window`, `localStorage`, `navigator`).

**Cost:** no HTML in the initial response — hurts SEO and causes layout shift (CLS).

## When to use none

If a component just displays data and never needs interactivity, skip the directive entirely. It renders as static HTML. Maximum performance, zero JS.
