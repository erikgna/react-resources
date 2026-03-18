import { createRoute } from '@tanstack/react-router'
import { lazy, Suspense } from 'react'
import { aboutLayoutRoute } from './_layout'
import Loading from '#/components/Loading'

const AboutComponent = lazy(() =>
  import('./index.lazy').then(m => ({ default: m.AboutComponent })),
)

export const aboutIndexRoute = createRoute({
  getParentRoute: () => aboutLayoutRoute,
  path: '/about',
  component: () => (
    <Suspense fallback={<Loading />}>
      <AboutComponent />
    </Suspense>
  ),
})
