TanStack Router is a modern, 100% type-safe routing library designed to solve common issues like "URL-state-as-a-black-box" and "loading waterfalls."

1. How to Use: The Core Workflow
The framework revolves around a Route Tree and File-Based Routing.

File-Based Routing: You define your routes by creating files in a src/routes directory. A bundler plugin (Vite/Webpack) automatically generates a routeTree.gen.ts file. This file is the "source of truth" for all types in your app.

The Root Route: Every app starts with a __root.tsx file. This acts as the global layout and provides the <Outlet /> where child routes render.

Type-Safe Navigation: Because the router knows your file structure, the <Link /> component and useNavigate hook provide autocomplete for your paths. If you change a route filename, TypeScript will throw an error everywhere you linked to it.

Search Params (The State Manager): TanStack Router treats search parameters (like ?page=1) as first-class state. You define a schema (e.g., using Zod) to validate them. These params are then available with full types in your components and loaders.
+1

Loaders: You fetch data at the route level using the loader function. This data is fetched before the component even starts to render, preventing "loading spinners for every component" (waterfalls).

2. "Under the Hood": How it Works
Understanding the architecture helps you leverage its power:

Lossless Type Inference: Unlike other routers that use manual type casting (as string), TanStack Router uses a complex chain of TypeScript generics to track state from the route definition all the way to the UI. It "infers" the types rather than you declaring them.

Built-in SWR Cache: It includes a lightweight caching layer (similar to TanStack Query but specialized for routing). It caches loader data, handles prefetching (fetching data when you hover over a link), and manages "stale-while-revalidate" logic.
+1

Structural Sharing: When search parameters change, the router compares the new state with the old one. If only one value changed, it keeps the object references of the other values the same. This prevents React from re-rendering components that didn't actually have their specific data change.
+1

History Abstraction: It uses a separate package, @tanstack/history, to manage the browser's history stack. This allows it to support hash routing, memory routing (for testing), and standard browser routing through a unified API.

Parallel Loading: When you navigate to a nested route (e.g., /dashboard/settings), the router identifies every loader in that hierarchy and fires them all in parallel, rather than waiting for the parent to finish before starting the child.

Important "Gotchas"
Loader Dependencies: If you want a loader to re-run when search params change, you must explicitly declare those params in loaderDeps.

Route Masking: It allows you to "mask" a complex URL with a prettier one (e.g., showing /photos/1 in the address bar while the actual route state might be much more complex).