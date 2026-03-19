## 1. Using folder structures for routing, how do they make it work as navigation?

Next.js scans the app/ (or pages/) folder at build time and maps files to routes automatically.
File names define the URL structure (e.g. app/users/[id]/page.tsx → /users/:id).
It generates an internal route tree with layouts, pages, and loading states.
On navigation, the Next.js router loads the right components (often lazily) and updates the UI without a full reload.

```tsx
const files = {
  './app/page.tsx': () => import('./app/page.tsx'),
  './app/users/page.tsx': () => import('./app/users/page.tsx'),
  './app/users/[id]/page.tsx': () => import('./app/users/[id]/page.tsx'),
}

function fileToRoute(path: string) {
  return path
    .replace('./app', '')
    .replace('/page.tsx', '')
    .replace(/\[([^\]]+)\]/g, ':$1') || '/'
}

const routes = Object.entries(files).map(([file, loader]) => ({
  path: fileToRoute(file),
  load: loader,
}))

[
  { path: '/', load: () => import('./app/page.tsx') },
  { path: '/users', load: () => import('./app/users/page.tsx') },
  { path: '/users/:id', load: () => import('./app/users/[id]/page.tsx') },
]

const tree = {
  layout: () => import('./app/layout.tsx'),
  children: [
    {
      path: '/',
      page: () => import('./app/page.tsx'),
    },
    {
      path: '/users',
      layout: () => import('./app/users/layout.tsx'),
      children: [
        {
          path: '/',
          page: () => import('./app/users/page.tsx'),
        },
        {
          path: ':id',
          page: () => import('./app/users/[id]/page.tsx'),
        },
      ],
    },
  ],
}
```

## What is the difference between dynamic route and static route?

A static route is a route with a hardcoded, exact path.
```/users```
A dynamic route is a route that includes variables (params) in the path.
```/users/:id```

## Why Tanstack dont use react-router?

### 1. Type Safety
Tanstack Params are type safe and can be validated with Zod.
React Router is basically a string.

### 2. Data First
Tanstack fetches data at the route level using the loader function.
It can cache with TanStack Query.
```tsx
createRoute({
  loader: () => queryClient.fetchQuery(...)
})
```

React Router has it as well, but was introduced later.
```tsx 
<Route loader={() => fetch('/api/user')} />
```

### 3. Nested Routes
```tsx
<Route path="users">
  <Route path=":id" element={<User />} />
</Route>
```

Tanstack has nested routes built-in.
```tsx
createRoute({
  path: 'users',
  children: [
    createRoute({ path: ':id', component: User }),
  ],
})
```