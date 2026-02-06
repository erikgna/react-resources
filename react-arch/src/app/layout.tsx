import { Outlet, NavLink } from 'react-router'
import { useAuth } from './providers/auth-provider'
import { Button } from '../shared/ui/button'

export function Layout() {
  const { logout } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex gap-4">
              <NavLink
                to="/orders"
                className={({ isActive }) =>
                  isActive
                    ? 'text-blue-600 font-semibold'
                    : 'text-gray-600 hover:text-gray-900'
                }
              >
                Orders
              </NavLink>
              <NavLink
                to="/queue"
                className={({ isActive }) =>
                  isActive
                    ? 'text-blue-600 font-semibold'
                    : 'text-gray-600 hover:text-gray-900'
                }
              >
                Queue
              </NavLink>
            </div>
            <Button variant="secondary" onClick={logout}>
              Logout
            </Button>
          </div>
        </div>
      </nav>
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
