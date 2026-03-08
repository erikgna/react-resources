# TanStack Router POC

| Feature | Where |
|---|---|
| File-based routing + auto-generated route tree | `src/routes/` → `routeTree.gen.ts` |
| Type-safe `Link` with `to`, `params`, `activeProps` | `index.tsx`, `__root.tsx` |
| Nested / layout routes (`<Outlet />`) | `dashboard.tsx` wraps `dashboard.posts.tsx` |
| Pathless layout route (`_layout` prefix) | `_layout.tsx` wraps `/about` without a URL segment |
| `createLazyFileRoute` — split config from component | `_layout.about.tsx` (config) + `_layout.about.lazy.tsx` (component) |
| Route context (`createRootRouteWithContext`) | `RouterContext` defined in `router.tsx`, passed in `main.tsx` |
| `beforeLoad` auth guard using context | `dashboard.tsx` reads `context.auth.isAuthenticated` |
| `useRouteContext()` in component | `dashboard.posts.tsx` displays `auth.username` |
| Search params with Zod validation (`validateSearch`) | `dashboard.posts.tsx` — `page` + `filter` |
| `loaderDeps` — re-run loader on search param change | `dashboard.posts.tsx` |
| `loader` — pre-render data fetching | `dashboard.posts.tsx`, `posts.$postId.tsx` |
| `pendingComponent` / `errorComponent` | both route files above |
| `redirect()` from `loader` | `posts.$postId.tsx` — `postId === '0'` redirects |
| `redirect()` from `beforeLoad` | `dashboard.tsx` — unauthenticated users redirected |
| `notFound()` from loader + `notFoundComponent` | `posts.$postId.tsx` — route-level; `__root.tsx` — global |
| Deferred data (`Await` + `Suspense`) | `posts.$postId.tsx` — `relatedPosts` is an unawaited Promise |
| `useParams()` | `posts.$postId.tsx` |
| `defaultPreload: 'intent'` (hover prefetch) | `router.tsx` |
| `scrollRestoration` | `router.tsx` |
| `useMatches()` breadcrumbs | `__root.tsx` — Breadcrumbs component renders all active route matches |
| `useMatch()` — specific route check | `__root.tsx` — reads `postId` param only when on the post route |
| `useBlocker()` with custom dialog | `dashboard.posts.tsx` — blocks navigation when note textarea has content |
| Route masking (`mask` prop) | `index.tsx` — URL bar shows `/posts/1` but renders `/dashboard/posts/1` |
| MSW for API mocking | `src/mocks/` — `/posts`, `/posts/:id`, `/posts/:id/related` |
