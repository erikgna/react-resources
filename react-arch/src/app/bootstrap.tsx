import { RouterProvider } from 'react-router'
import { AuthProvider } from './providers/auth-provider'
import { SWRProvider } from './providers/swr-config'
import { router } from './router'

export function App() {
  return (
    <AuthProvider>
      <SWRProvider>
        <RouterProvider router={router} />
      </SWRProvider>
    </AuthProvider>
  )
}
