import { createRouter } from '@tanstack/react-router'
import { rootRoute, type RouterContext } from './routes/__root'
import { indexRoute } from './routes/index'
import { aboutLayoutRoute } from './routes/about/_layout'
import { aboutIndexRoute } from './routes/about/index'
import { dashboardRoute } from './routes/dashboard/index'
import { postsRoute } from './routes/dashboard/posts/index'
import { postIdRoute } from './routes/dashboard/posts/$postId'

const routeTree = rootRoute.addChildren([
  indexRoute,
  aboutLayoutRoute.addChildren([aboutIndexRoute]),
  dashboardRoute.addChildren([
    postsRoute.addChildren([postIdRoute]),
  ]),
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
