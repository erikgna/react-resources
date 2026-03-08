# Next.js App Router POC

| Feature | Where |
|---|---|
| File-system routing | any `page.tsx` — folder path = URL |
| Root layout | `app/layout.tsx` — persists across all navigations |
| Nested layout | `app/dashboard/layout.tsx` — wraps all `/dashboard/*` pages with sidebar |
| Route group `(marketing)` | `app/(marketing)/layout.tsx` — shared layout for `/about` without adding a URL segment |
| `template.tsx` | `app/dashboard/template.tsx` — re-mounts on every navigation (unlike layout) |
| `loading.tsx` | `app/dashboard/posts/loading.tsx`, `[postId]/loading.tsx` — automatic Suspense boundary |
| `error.tsx` | `app/dashboard/posts/error.tsx` — error boundary with `reset()`, must be `'use client'` |
| Global `not-found.tsx` | `app/not-found.tsx` — shown for any unmatched URL |
| Route-level `not-found.tsx` | `app/dashboard/posts/[postId]/not-found.tsx` — shown when `notFound()` is called |
| `notFound()` | `app/dashboard/posts/[postId]/page.tsx` — throws not-found when post is missing |
| `redirect()` from Server Component | `app/dashboard/page.tsx` — redirects `/dashboard` → `/dashboard/posts` |
| Static metadata | `app/dashboard/posts/page.tsx` — `export const metadata` |
| Dynamic `generateMetadata` | `app/dashboard/posts/[postId]/page.tsx` — title based on post data |
| Dynamic route `[postId]` | `app/dashboard/posts/[postId]/page.tsx` — `params` prop |
| `generateStaticParams` | `app/dashboard/posts/[postId]/page.tsx` — pre-generates post pages at build |
| Catch-all route `[...slug]` | `app/docs/[...slug]/page.tsx` — matches `/docs/a/b/c/...` |
| `searchParams` in Server Component | `app/dashboard/posts/page.tsx` — async prop for `page` + `filter` |
| Async Server Component | `app/dashboard/posts/page.tsx`, `[postId]/page.tsx` — `async` functions with direct data access |
| Client Component | `app/_components/Nav.tsx`, `PostsFilter.tsx` — `'use client'` directive |
| `usePathname()` | `app/_components/Nav.tsx` — highlights active nav link |
| `useRouter()` | `app/dashboard/posts/_components/PostsFilter.tsx` — programmatic navigation |
| `useSearchParams()` | `app/dashboard/posts/_components/PostsFilter.tsx` — reads current URL params |
| `Link` component | throughout — client-side navigation with prefetching |
| Route Handler GET | `app/api/posts/route.ts` — `GET /api/posts?filter=` |
| Route Handler dynamic | `app/api/posts/[id]/route.ts` — `GET /api/posts/:id` |
| Route Handler POST + `revalidatePath` | `app/api/posts/[id]/like/route.ts` — mutates data then invalidates the cached page |
| Middleware | `middleware.ts` — runs before `/dashboard/*`, guards with `isAuthenticated` |
| Parallel routes `@modal` | `app/dashboard/@modal/` — modal slot rendered alongside `children` in layout |
| Intercepting routes `(.)` | `app/dashboard/@modal/(.)posts/[postId]/page.tsx` — soft-nav shows modal; hard-nav shows full page |
| `useSelectedLayoutSegment()` | `app/dashboard/_components/ActiveSegment.tsx` — reads active child segment from inside layout |
| `cookies()` from `next/headers` | `app/dashboard/layout.tsx` — reads session cookie in Server Component |
| `headers()` from `next/headers` | `app/dashboard/layout.tsx` — reads user-agent in Server Component |
| `router.refresh()` | `app/dashboard/posts/[postId]/_components/LikeButton.tsx` — re-fetches Server Component data after mutation |
