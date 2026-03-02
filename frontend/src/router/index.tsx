/**
 * Router Configuration - Structure optimisée
 * Organisation des routes par fonctionnalités avec lazy loading
 */
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuth } from '@/hooks/useAuth'

// Lazy loading des pages pour optimiser le bundle
const Dashboard = lazy(() => import('@/pages/dashboard/DashboardNew'))
const Login = lazy(() => import('@/pages/auth/Login'))

// Pages queues
const QueuesList = lazy(() => import('@/pages/queues/Queues'))
const TicketsCalled = lazy(() => import('@/pages/queues/TicketsCalled'))
const TicketsAbsent = lazy(() => import('@/pages/queues/TicketsAbsent'))
const TicketsPriority = lazy(() => import('@/pages/queues/TicketsPriority'))

// Pages admin
const Agents = lazy(() => import('@/pages/admin/Agents'))
const Services = lazy(() => import('@/pages/admin/Services'))
const Establishments = lazy(() => import('@/pages/admin/Establishments'))
const Stats = lazy(() => import('@/pages/admin/Stats'))

// Pages communes
const Settings = lazy(() => import('@/pages/Settings'))

// Composant de chargement
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      <p className="mt-4 text-muted-foreground">Chargement...</p>
    </div>
  </div>
)

export default function Router() {
  const { user, isAuthenticated } = useAuth()

  const router = createBrowserRouter([
    {
      path: '/login',
      element: (
        <Suspense fallback={<PageLoader />}>
          <Login />
        </Suspense>
      )
    },
    {
      path: '/',
      element: (
        <ProtectedRoute>
          <AppLayout />
        </ProtectedRoute>
      ),
      children: [
        {
          index: true,
          element: (
            <Suspense fallback={<PageLoader />}>
              <Dashboard />
            </Suspense>
          )
        },
        {
          path: 'queues',
          children: [
            {
              index: true,
              element: (
                <Suspense fallback={<PageLoader />}>
                  <QueuesList />
                </Suspense>
              )
            },
            {
              path: 'called',
              element: (
                <Suspense fallback={<PageLoader />}>
                  <TicketsCalled />
                </Suspense>
              )
            },
            {
              path: 'absent',
              element: (
                <Suspense fallback={<PageLoader />}>
                  <TicketsAbsent />
                </Suspense>
              )
            },
            {
              path: 'priority',
              element: (
                <Suspense fallback={<PageLoader />}>
                  <TicketsPriority />
                </Suspense>
              )
            }
          ]
        },
        // Routes admin (protégées)
        ...(user?.role === 'admin' ? [
          {
            path: 'agents',
            element: (
              <Suspense fallback={<PageLoader />}>
                <Agents />
              </Suspense>
            )
          },
          {
            path: 'services',
            element: (
              <Suspense fallback={<PageLoader />}>
                <Services />
              </Suspense>
              )
          },
          {
            path: 'establishments',
            element: (
              <Suspense fallback={<PageLoader />}>
                <Establishments />
              </Suspense>
              )
          },
          {
            path: 'stats',
            element: (
              <Suspense fallback={<PageLoader />}>
                <Stats />
              </Suspense>
            )
          }
        ] : []),
        {
          path: 'settings',
          element: (
            <Suspense fallback={<PageLoader />}>
              <Settings />
            </Suspense>
          )
        }
      ]
    },
    {
      path: '*',
      element: (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">404</h1>
            <p className="text-muted-foreground mb-8">Page non trouvée</p>
            <a 
              href="/" 
              className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Retour à l'accueil
            </a>
          </div>
        </div>
      )
    }
  ])

  return <RouterProvider router={router} />
}
