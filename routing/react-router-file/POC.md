# React Router v7 POC

Framework Mode is a superset of Data and Declarative modes. All three are demonstrated in one app.

## Mode Hierarchy

```
Declarative (Library)  →  routing primitives only
      +
Data Router            →  adds loaders, actions, fetchers, deferred data
      +
Framework              →  adds SSR, clientLoader, meta/links, HydrateFallback, resource routes
```

## Feature Map

| Feature | Mode | Where |
|---|---|---|
| Route config (`routes.ts`) | Framework | `app/routes.ts` — `index()`, `route()`, `layout()` |
| Layout route (`layout()`) | Framework | `app/routes.ts` — `dashboard.tsx` wraps posts without a URL segment |
| Resource route (no component) | Framework | `app/routes/api.posts.tsx` — `GET /api/posts` returns raw JSON |
| Server `loader` | Framework | `dashboard.tsx`, `dashboard.posts.tsx`, `dashboard.posts.$postId.tsx` |
| Server `action` | Framework | `dashboard.posts.$postId.tsx` — handles like + bookmark POST |
| `clientLoader` | Framework | `dashboard.posts.tsx` — augments server data with `localStorage` |
| `clientLoader.hydrate = true` | Framework | `dashboard.posts.tsx` — forces clientLoader to run before first render |
| `HydrateFallback` | Framework | `dashboard.posts.tsx` — skeleton shown during SSR hydration |
| `meta()` — static | Framework | `home.tsx`, `about.tsx` |
| `meta()` — dynamic from loader | Framework | `dashboard.posts.$postId.tsx` — title uses post.title |
| `links()` — root | Framework | `root.tsx` — Google Fonts injected globally |
| `links()` — per route | Framework | `about.tsx` — preloads favicon for this route only |
| `redirect()` from loader | Framework + Data | `dashboard.tsx` — server-side auth guard |
| Throwing a `Response` (404) | Framework | `dashboard.posts.$postId.tsx` loader — triggers ErrorBoundary |
| `<Form method="post">` | Framework | `dashboard.posts.$postId.tsx` — like button, progressive enhancement |
| `<Form method="get">` | Framework | `dashboard.posts.tsx` — filter form, no JS needed |
| `useLoaderData()` | Data | `dashboard.posts.$postId.tsx` |
| `useActionData()` | Data | `dashboard.posts.$postId.tsx` — shows like result |
| `useFetcher()` | Data | `dashboard.posts.$postId.tsx` — bookmark without navigation |
| `useNavigation()` | Data | `dashboard.posts.tsx` — global pending state |
| `defer()` + `Await` + `Suspense` | Data | `dashboard.posts.$postId.tsx` — related posts stream in after 800ms |
| `shouldRevalidate()` | Data | `dashboard.posts.tsx` — skip revalidation on hash-only changes |
| `ErrorBoundary` export | Data | `dashboard.posts.tsx`, `dashboard.posts.$postId.tsx` |
| `<Outlet />` | Declarative | `root.tsx`, `dashboard.tsx` |
| `<NavLink>` with render prop | Declarative | `root.tsx` header, `dashboard.tsx` sidebar |
| `<Link>` | Declarative | throughout |
| `<ScrollRestoration />` | Declarative | `root.tsx` |
| `useParams()` | Declarative | `dashboard.posts.$postId.tsx` |
| `useSearchParams()` | Declarative | `about.tsx` — tab state in URL |
| `useLocation()` | Declarative | `about.tsx` — shows pathname + search |
| `useNavigate()` | Declarative | `about.tsx` — programmatic navigation |
| `useMatches()` breadcrumbs | Data | `root.tsx` App() — all active matches root→leaf rendered as breadcrumb trail |
| `useRevalidator()` | Data | `dashboard.posts.tsx` — manual loader refresh button |
| `clientAction` | Framework | `dashboard.posts.$postId.tsx` — runs on client after server action, can update local state |
| Wildcard `*` route | Declarative | `app/routes.ts` + `routes/catchall.tsx` — catches all unmatched URLs |
| `useLocation()` in 404 | Declarative | `routes/catchall.tsx` — shows the unmatched pathname |
