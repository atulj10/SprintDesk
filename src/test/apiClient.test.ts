import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  ApiError,
  apiRequest,
  clearAccessToken,
  getAccessToken,
  setAccessToken,
  setRefreshHandler,
} from '@/services/api/apiClient'

/**
 * Auth interceptor tests:
 * - bearer token attachment
 * - proactive silent refresh on simulated expiry
 * - reactive refresh + retry after a 401
 * - hard failure when the refresh itself fails
 *
 * The Authorization header is logged AT CALL TIME because the client mutates
 * a single Headers instance across attempts.
 */

const fetchMock = vi.fn()
let authHeaderLog: (string | null)[] = []

beforeEach(() => {
  authHeaderLog = []
  fetchMock.mockImplementation(async (_url: string, init?: RequestInit) => {
    authHeaderLog.push(new Headers(init?.headers).get('Authorization'))
    return new Response(JSON.stringify({ ok: true }), { status: 200 })
  })
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  clearAccessToken()
  setRefreshHandler(null)
  fetchMock.mockReset()
  vi.unstubAllGlobals()
})

describe('apiClient interceptor', () => {
  it('attaches the bearer token to outgoing requests', async () => {
    setAccessToken('valid-token', Date.now() + 60_000)

    await apiRequest('https://api.example.test/thing')

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(authHeaderLog).toEqual(['Bearer valid-token'])
  })

  it('sends requests without an Authorization header while logged out', async () => {
    await apiRequest('https://api.example.test/open')

    expect(authHeaderLog).toEqual([null])
  })

  it('proactively refreshes an expired token before sending (silent refresh)', async () => {
    // Simulated TTL already elapsed.
    setAccessToken('stale-token', Date.now() - 1_000)
    setRefreshHandler(async () => {
      setAccessToken('fresh-token', Date.now() + 60_000)
    })

    await apiRequest('https://api.example.test/protected')

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(authHeaderLog).toEqual(['Bearer fresh-token'])
  })

  it('retries once through refresh when the server responds 401', async () => {
    setAccessToken('rejected-token', Date.now() + 60_000)
    setRefreshHandler(async () => {
      setAccessToken('rotated-token', Date.now() + 60_000)
    })

    let callCount = 0
    fetchMock.mockImplementation(async (_url: string, init?: RequestInit) => {
      authHeaderLog.push(new Headers(init?.headers).get('Authorization'))
      callCount += 1
      if (callCount === 1) {
        return new Response('unauthorized', { status: 401 })
      }
      return new Response(JSON.stringify({ retried: true }), { status: 200 })
    })

    const result = await apiRequest<{ retried: boolean }>('https://api.example.test/secure')

    expect(result.retried).toBe(true)
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(authHeaderLog).toEqual(['Bearer rejected-token', 'Bearer rotated-token'])
  })

  it('does not retry more than once on repeated 401s', async () => {
    setAccessToken('bad-token', Date.now() + 60_000)
    setRefreshHandler(async () => {
      setAccessToken('still-bad-token', Date.now() + 60_000)
    })

    let callCount = 0
    fetchMock.mockImplementation(async () => {
      callCount += 1
      return new Response('unauthorized', { status: 401 })
    })

    await expect(apiRequest('https://api.example.test/secure')).rejects.toBeInstanceOf(ApiError)
    expect(callCount).toBe(2)
  })

  it('fails without hitting the network when refresh is impossible', async () => {
    setAccessToken('expired-token', Date.now() - 5_000)
    setRefreshHandler(async () => {
      throw new ApiError('Refresh token rejected', 401)
    })

    await expect(apiRequest('https://api.example.test/protected')).rejects.toThrow(
      'Refresh token rejected',
    )

    // The request never went out with a known-expired token.
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('clears the in-memory token when the post-401 refresh fails', async () => {
    setAccessToken('doomed-token', Date.now() + 60_000)
    setRefreshHandler(async () => {
      throw new ApiError('Session expired', 401)
    })
    fetchMock.mockImplementation(async (_url: string, init?: RequestInit) => {
      authHeaderLog.push(new Headers(init?.headers).get('Authorization'))
      return new Response('unauthorized', { status: 401 })
    })

    await expect(apiRequest('https://api.example.test/secure')).rejects.toThrow('Session expired')

    // The module must hold NO usable token afterwards.
    expect(getAccessToken()).toBeNull()
  })
})
