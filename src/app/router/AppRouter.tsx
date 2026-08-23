import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute, PublicOnlyRoute } from '@/app/router/ProtectedRoute'
import { FullScreenLoader } from '@/components/layout/FullScreenLoader'

// Route-level code splitting keeps the initial bundle small.
const LoginPage = lazy(() => import('@/pages/LoginPage'))
const DashboardPage = lazy(() => import('@/pages/DashboardPage'))
const BoardPage = lazy(() => import('@/pages/BoardPage'))
const AnalyticsPage = lazy(() => import('@/pages/AnalyticsPage'))

const LazyAppLayout = lazy(() =>
  import('@/components/layout/AppLayout').then((module) => ({
    default: module.AppLayout,
  })),
)

function RouteFallback() {
  return <FullScreenLoader label="Loading page…" />
}

/**
 * Application routing.
 * - /login            public only
 * - /dashboard|board|analytics   protected, rendered inside AppLayout
 * - unknown paths redirect to /dashboard
 */
export function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <LoginPage />
              </PublicOnlyRoute>
            }
          />

          <Route
            element={
              <ProtectedRoute>
                <LazyAppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/board" element={<BoardPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
          </Route>

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
