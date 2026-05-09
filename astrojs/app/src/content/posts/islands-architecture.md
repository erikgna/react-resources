---
title: "Islands Architecture: Static HTML with Interactive Pockets"
date: 2024-01-15
tags: ["astro", "performance", "architecture"]
draft: false
---

# Islands Architecture

Astro's core innovation is treating pages as oceans of static HTML with isolated interactive "islands" scattered through them.

## Why It Matters

Traditional SPAs (React, Vue, Angular) ship a blank HTML file and render everything client-side. Every user pays the full JS cost upfront.

Astro flips this: HTML is the default output. Interactive components are the exception, not the rule. The browser only downloads JS for the islands you use, when you use them.

## The Mental Model

Think of a news article page:
- **Header** — static HTML, no JS needed
- **Article body** — static HTML, no JS needed
- **Comment box** — needs React, hydrated with `client:load`
- **Share widget** — low priority, use `client:idle`
- **Related articles carousel** — below fold, use `client:visible`

Total JS shipped: only the comment box + share widget + carousel code. The rest is pure HTML.

## Trade-offs

Islands cannot share state directly. If your comment box and header both need the same user object, you need a client-side store (like [nanostores](https://github.com/nanostores/nanostores)).

For apps that are mostly interactive (dashboards, editors), Astro adds friction without much benefit. Use Next.js or Remix instead.
