---
title: "Astro vs Next.js: Choosing the Right Tool"
date: 2024-03-20
tags: ["astro", "nextjs", "comparison"]
draft: false
---

# Astro vs Next.js

Both are great frameworks. The choice depends on what you're building.

## Use Astro when

- Content-heavy site: blog, docs, marketing, portfolio
- Performance is the primary constraint
- Most pages need little or no interactivity
- You want to mix React + Vue + Svelte on the same page
- You need zero-JS default with selective hydration

## Use Next.js when

- Highly interactive app: dashboard, editor, SaaS product
- Heavy client-side state across many routes
- You need React Server Components with streaming
- Team is already fluent in React ecosystem
- You need `getServerSideProps`-style data fetching with full React tree

## The overlap

Both support SSR, SSG, and hybrid modes. Both work well with React. The key difference is the default assumption:

- **Next.js** assumes "this is a React app that renders on the server"
- **Astro** assumes "this is a static site that may have interactive pockets"

Wrong tool for the job causes pain. A highly interactive Astro site fights the framework. A simple blog in Next.js ships too much JS.
