import {
  ApiError,
  clearAccessToken,
  setAccessToken,
  setRefreshHandler,
} from '@/services/api/apiClient'
import { authService } from '@/services/auth.service'
import type { LoginCredentials, SessionUser } from '@/types/auth'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Authentication state (Zustand).
 *
 * The access token itself lives ONLY in memory (apiClient). This store
 * persists the refresh token + user profile so a reload can silently restore
 * the session through the refresh endpoint.
 */

export type AuthStatus = 'initializing' | 'authenticated' | 'unauthenticated'

interface AuthState {
  status: AuthStatus
  user: SessionUser | null
  refreshToken: string | null
  accessTokenExpiresAt: number | null

  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => void
  /** Validates any persisted session once at application boot. */
  initializeSession: () => Promise<void>
}

/** Single-flight guard so StrictMode double-effects don't double-refresh. */
let sessionInitPromise: Promise<void> | null = null

/**
 * Silent refresh implementation shared by the interceptor and session restore.
 * On failure it performs a hard logout and rethrows for callers.
 */
export async function performTokenRefresh(): Promise<void> {
  const storedRefreshToken = useAuthStore.getState().refreshToken
  if (!storedRefreshToken) {
    throw new ApiError('No refresh token available', 401)
  }

  try {
    const result = await authService.refreshTokens(storedRefreshToken)
    setAccessToken(result.accessToken, result.accessTokenExpiresAt)
    useAuthStore.setState({
      refreshToken: result.refreshToken,
      accessTokenExpiresAt: result.accessTokenExpiresAt,
    })
  } catch (error) {
    useAuthStore.getState().logout()
    throw error instanceof ApiError ? error : new ApiError('Session refresh failed', 401)
  }
}

// Register with the HTTP client so it can renew tokens transparently.
setRefreshHandler(() => performTokenRefresh())

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      status: 'initializing',
      user: null,
      refreshToken: null,
      accessTokenExpiresAt: null,

      async login(credentials) {
        const result = await authService.login(credentials)
        set({
          status: 'authenticated',
          user: result.user,
          refreshToken: result.refreshToken,
          accessTokenExpiresAt: result.accessTokenExpiresAt,
        })
      },

      logout() {
        clearAccessToken()
        set({
          status: 'unauthenticated',
          user: null,
          refreshToken: null,
          accessTokenExpiresAt: null,
        })
      },

      async initializeSession() {
        if (sessionInitPromise) return sessionInitPromise

        sessionInitPromise = (async () => {
          const { refreshToken } = useAuthStore.getState()
          if (!refreshToken) {
            set({ status: 'unauthenticated' })
            return
          }
          try {
            await performTokenRefresh()
            useAuthStore.setState({ status: 'authenticated' })
          } catch {
            // performTokenRefresh already logged us out.
          }
        })()

        try {
          await sessionInitPromise
        } finally {
          sessionInitPromise = null
        }
      },
    }),
    {
      name: 'sprintdesk.auth',
      partialize: (state) => ({
        user: state.user,
        refreshToken: state.refreshToken,
        accessTokenExpiresAt: state.accessTokenExpiresAt,
      }),
    },
  ),
)

export function useIsAuthenticated(): boolean {
  return useAuthStore((state) => state.status === 'authenticated')
}
