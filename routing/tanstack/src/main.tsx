import ReactDOM from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import { getRouter } from './router'
import type { RouterContext } from './router'

const context: RouterContext = {
  auth: { isAuthenticated: true, username: 'admin' },
}

const router = getRouter(context)

async function main() {
  if (import.meta.env.DEV) {
    const { worker } = await import('./mocks/browser')
    await worker.start({ onUnhandledRequest: 'bypass' })
  }

  const rootElement = document.getElementById('app')!
  if (!rootElement.innerHTML) {
    const root = ReactDOM.createRoot(rootElement)
    root.render(<RouterProvider router={router} />)
  }
}

main()
