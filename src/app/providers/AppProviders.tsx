import { useEffect, type ReactNode } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import { useAuthStore } from '@/stores/auth.store'
import { ErrorBoundary } from '@/components/ErrorBoundary'

interface AppProvidersProps {
  children: ReactNode
}

/**
 * Composition root for global providers:
 * - ErrorBoundary catches unexpected render failures
 * - QueryClientProvider owns all server state
 * - session bootstrap validates any persisted auth once on mount
 */
export function AppProviders({ children }: AppProvidersProps) {
  const initializeSession = useAuthStore((state) => state.initializeSession)

  useEffect(() => {
    void initializeSession()
  }, [initializeSession])

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </ErrorBoundary>
  )
}
