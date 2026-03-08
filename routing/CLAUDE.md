# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is a routing comparison project with four independent sub-projects, each implementing the same concepts (auth guards, search params, data loading, pending/error states) using a different router:

| Sub-project | Router | Environment | Dev Command |
|---|---|---|---|
| `tanstack/` | TanStack Router v1 | React 19 + Vite SPA | `npm run dev` |
| `react-router/framework/` | React Router v7 (Framework mode) | React 19 + Vite + SSR | `npm run dev` |
| `nextjs/` | Next.js 16 App Router | React 19 + SSR | `npm run dev` |
| `react-navigation/` | React Navigation v7 | React Native + Expo | `npm start` |

Each sub-project is independent. Always `cd` into the relevant sub-project before running commands.

## Commands

### tanstack/
```bash
npm run dev        # start dev server on port 3000
npm run build      # production build
npm run test       # run tests with vitest
npm run lint       # eslint
npm run check      # prettier + eslint fix
```

### react-router/framework/
```bash
npm run dev        # start dev server
npm run build      # production build
npm run typecheck  # react-router typegen + tsc
```

### nextjs/
```bash
npm run dev        # start Next.js dev server
npm run build      # production build
npm run lint       # eslint
```

### react-navigation/
```bash
npm start          # start Expo dev client
npm run ios        # run on iOS simulator
npm run android    # run on Android emulator
npm run web        # run in browser
```

## Architecture

### TanStack Router (`tanstack/`)
- File-based routing: route files live in `src/routes/`. The Vite plugin auto-generates `src/routeTree.gen.ts` — never edit this file manually.
- `src/routes/__root.tsx` is the global layout; all routes render inside its `<Outlet />`.
- `src/router.tsx` creates the router from the generated tree and registers it globally via `declare module`.
- Route files use `createFileRoute('/path')({...})` with `beforeLoad` for auth, `validateSearch` (Zod) for typed search params, `loader` for pre-render data fetching, and `pendingComponent`/`errorComponent` for UI states.
- Path alias `#/*` maps to `src/*`.
- MSW (`src/mocks/`) intercepts API calls in development; the service worker is registered in `src/main.tsx`.
- Tests use Vitest + Testing Library + jsdom.

### React Router v7 Framework (`react-router/framework/`)
- Route tree defined in `app/routes.ts` using the `@react-router/dev/routes` config API.
- Route files export a `loader` (runs server-side by default) and a default component that calls `useLoaderData()`.
- Auth is handled inside `loader` by throwing `redirect('/login')` — the server intercepts before the client downloads anything.
- Search params are parsed manually via `new URL(request.url).searchParams` inside the loader — no built-in Zod validation.
- `app/root.tsx` is the global shell (equivalent to `__root.tsx`).

### Next.js App Router (`nextjs/`)
- Folder structure under `app/` is the route tree: `app/dashboard/page.tsx` maps to `/dashboard`.
- No `loader` function — `page.tsx` files are `async` Server Components that fetch directly.
- Auth uses `middleware.ts` at the root (edge runtime) or a `redirect()` call inside `layout.tsx`.
- Search params arrive as plain strings in the `searchParams` prop; manual Zod parsing or `nuqs` required for type safety.
- Loading/error UI uses co-located `loading.tsx` and `error.tsx` special files.

### React Navigation (`react-navigation/`)
- Mobile-first (React Native + Expo). Routing is code-based, not file-based.
- `src/navigation/index.tsx` defines the full navigator tree using `createNativeStackNavigator` and `createBottomTabNavigator`, then exports it as `createStaticNavigation(RootStack)`.
- Type safety is manual: define a `RootStackParamList` and extend `ReactNavigation.RootParamList`.
- No built-in loader API — use `useFocusEffect` (not `useEffect`) for data fetching so it re-runs on screen focus.
- Auth uses conditional rendering: render `AuthStack` or `AppStack` based on auth state.
