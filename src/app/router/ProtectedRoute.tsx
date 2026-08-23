import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth.store'
import { FullScreenLoader } from '@/components/layout/FullScreenLoader'

interface RouteGuardProps {
  children: ReactNode
}

/** Blocks unauthenticated access; shows a full-screen loader while validating. */
export function ProtectedRoute({ children }: RouteGuardProps) {
  const status = useAuthStore((state) => state.status)
  const location = useLocation()

  if (status === 'initializing') {
    return <FullScreenLoader />
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return children
}

/** Keeps authenticated users away from /login (and other public-only routes). */
export function PublicOnlyRoute({ children }: RouteGuardProps) {
  const status = useAuthStore((state) => state.status)
  const location = useLocation()

  if (status === 'initializing') {
    return <FullScreenLoader />
  }

  if (status === 'authenticated') {
    const from = location.state?.from
    return <Navigate to={typeof from === 'string' ? from : '/dashboard'} replace />
  }

  return children
}
