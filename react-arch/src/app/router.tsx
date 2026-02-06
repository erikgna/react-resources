import { createBrowserRouter, Navigate } from 'react-router'
import { LoginPage } from '../pages/login'
import { OrdersPage } from '../pages/orders'
import { QueuePage } from '../pages/queue'
import { ProtectedRoute } from '../pages/protected-route'
import { Layout } from './layout'

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/orders" replace />
      },
      {
        path: 'orders',
        element: <OrdersPage />
      },
      {
        path: 'queue',
        element: <QueuePage />
      }
    ]
  }
])
