import { createRouter } from '@tanstack/react-router'
import { rootRoute, type RouterContext } from './routes/root'
import { homeRoute } from './routes/home'
import { aboutLayoutRoute, aboutRoute } from './routes/about'
import { dashboardRoute } from './routes/dashboard'
import { postsRoute } from './routes/posts'
import { postDetailRoute } from './routes/post-detail'

const routeTree = rootRoute.addChildren([
  homeRoute,
  aboutLayoutRoute.addChildren([aboutRoute]),
  dashboardRoute.addChildren([postsRoute.addChildren([postDetailRoute])]),
])

export function getRouter(context: RouterContext) {
  return createRouter({
    routeTree,
    context,
    scrollRestoration: true,
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
  })
}

export type { RouterContext }

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
