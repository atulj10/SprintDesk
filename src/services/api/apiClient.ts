/**
 * Minimal HTTP client used by every service in the app.
 *
 * Responsibilities (the "interceptor"):
 * - attaches the bearer access token to outgoing requests
 * - treats the access token as expired after a simulated TTL and proactively
 *   refreshes it before the request goes out
 * - retries once through a silent token refresh when the server answers 401
 * - clears the in-memory token when refreshing is impossible
 *
 * The access token lives in memory ONLY. Persisting/restoring the session is
 * owned by the auth store (which holds the refresh token) and registers its
 * refresh implementation here via setRefreshHandler, keeping this module free
 * of any dependency on React/Zustand.
 */

export class ApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export type RefreshHandler = () => Promise<void>

let accessToken: string | null = null
let accessTokenExpiresAt: number | null = null
let refreshHandler: RefreshHandler | null = null
let inflightRefresh: Promise<void> | null = null

export function setAccessToken(token: string, expiresAtMs: number): void {
  accessToken = token
  accessTokenExpiresAt = expiresAtMs
}

export function clearAccessToken(): void {
  accessToken = null
  accessTokenExpiresAt = null
}

export function getAccessToken(): string | null {
  return accessToken
}

export function isAccessTokenExpired(now: number = Date.now()): boolean {
  return accessTokenExpiresAt !== null && now >= accessTokenExpiresAt
}

export function setRefreshHandler(handler: RefreshHandler | null): void {
  refreshHandler = handler
}

/** Runs the refresh handler at most once concurrently (single-flight). */
function runRefresh(): Promise<void> {
  if (!inflightRefresh) {
    const handler = refreshHandler
    const promise = handler
      ? handler()
      : Promise.reject(new ApiError('No refresh handler configured', 401))
    inflightRefresh = promise.finally(() => {
      inflightRefresh = null
    })
  }
  return inflightRefresh
}

export interface RequestOptions {
  /** Skip bearer attachment and refresh handling (login/refresh themselves). */
  skipAuth?: boolean
}

export async function apiRequest<T>(
  url: string,
  init: RequestInit = {},
  options: RequestOptions = {},
): Promise<T> {
  const skipAuth = options.skipAuth ?? false

  if (!skipAuth) {
    // Proactive refresh: if our simulated TTL has passed, renew silently first.
    if ((!accessToken || isAccessTokenExpired()) && refreshHandler) {
      try {
        await runRefresh()
      } catch (error) {
        clearAccessToken()
        throw error
      }
    }
  }

  const headers = new Headers(init.headers)
  if (!skipAuth && accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`)
  }

  let response = await fetch(url, { ...init, headers })

  // Reactive retry: a 401 means our token was rejected - refresh once and retry.
  if (response.status === 401 && !skipAuth && refreshHandler) {
    try {
      await runRefresh()
    } catch (error) {
      clearAccessToken()
      throw error
    }
    headers.set('Authorization', accessToken ? `Bearer ${accessToken}` : '')
    response = await fetch(url, { ...init, headers })
  }

  if (!response.ok) {
    throw new ApiError(`Request failed with status ${response.status}`, response.status)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}
