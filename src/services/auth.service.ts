import { ApiError, apiRequest, setAccessToken } from '@/services/api/apiClient'
import { DUMMYJSON_BASE_URL } from '@/lib/env'
import type {
  DummyAuthUser,
  LoginCredentials,
  LoginResult,
  SessionUser,
} from '@/types/auth'

/**
 * Simulated access-token lifetime. The real DummyJSON token lives ~60 minutes;
 * we treat it as expired sooner so the silent-refresh flow is demonstrable.
 */
export const ACCESS_TOKEN_TTL_MS = 10 * 60 * 1000

/** The access token should be considered stale slightly before it expires. */
export const ACCESS_TOKEN_EXPIRY_SKEW_MS = 30 * 1000

type DummyAuthResponse = AuthTokensShape

interface AuthTokensShape {
  accessToken?: string
  refreshToken?: string
  userInfo?: Partial<DummyAuthUser>
  id?: number
  username?: string
  email?: string
  firstName?: string
  lastName?: string
  image?: string
}

function toSessionUser(payload: AuthTokensShape): SessionUser {
  const user = payload.userInfo ?? payload
  return {
    id: user.id ?? 0,
    username: user.username ?? '',
    email: user.email ?? '',
    firstName: user.firstName ?? '',
    lastName: user.lastName ?? '',
    image: user.image ?? '',
  }
}

export const authService = {
  /** Authenticates against DummyJSON and primes the in-memory access token. */
  async login(credentials: LoginCredentials): Promise<LoginResult> {
    let payload: DummyAuthResponse
    try {
      payload = await apiRequest<DummyAuthResponse>(`${DUMMYJSON_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...credentials }),
      }, { skipAuth: true })
    } catch (error) {
      if (error instanceof ApiError && error.status === 400) {
        throw new ApiError('Invalid username or password', 400)
      }
      throw error
    }

    if (!payload.accessToken || !payload.refreshToken) {
      throw new ApiError('Malformed authentication response', 502)
    }

    const expiresAt = Date.now() + ACCESS_TOKEN_TTL_MS - ACCESS_TOKEN_EXPIRY_SKEW_MS
    setAccessToken(payload.accessToken, expiresAt)

    return {
      accessToken: payload.accessToken,
      refreshToken: payload.refreshToken,
      user: toSessionUser(payload),
      accessTokenExpiresAt: expiresAt,
    }
  },

  /**
   * Exchanges a refresh token for a new token pair. Does NOT touch the
   * in-memory access token - callers decide what to do with the result.
   */
  async refreshTokens(refreshToken: string): Promise<LoginResult> {
    const payload = await apiRequest<DummyAuthResponse>(
      `${DUMMYJSON_BASE_URL}/auth/refresh`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken, expiresInMins: 60 }),
      },
      { skipAuth: true },
    )

    if (!payload.accessToken || !payload.refreshToken) {
      throw new ApiError('Malformed refresh response', 502)
    }

    const expiresAt = Date.now() + ACCESS_TOKEN_TTL_MS - ACCESS_TOKEN_EXPIRY_SKEW_MS

    return {
      accessToken: payload.accessToken,
      refreshToken: payload.refreshToken,
      user: toSessionUser(payload),
      accessTokenExpiresAt: expiresAt,
    }
  },
}
