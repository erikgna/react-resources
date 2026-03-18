import { createRoute, Outlet, redirect } from '@tanstack/react-router'
import { rootRoute } from '../__root'

export const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dashboard',
  component: DashboardLayout,
  beforeLoad: ({ context, location }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({
        to: '/',
        search: { redirect: location.href },
      })
    }
  },
})

function DashboardLayout() {
  return <Outlet />
}
