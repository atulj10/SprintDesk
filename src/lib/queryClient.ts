import { QueryClient } from '@tanstack/react-query'

/**
 * Shared QueryClient. Data lives in a localStorage-backed repository, so a
 * modest staleTime keeps the app snappy without serving stale board state
 * after mutations (mutations always invalidate explicitly).
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
    mutations: {
      retry: 0,
    },
  },
})
