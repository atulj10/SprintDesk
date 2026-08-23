export interface LoginCredentials {
  username: string
  password: string
  expiresInMins?: number
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface DummyAuthUser {
  id: number
  username: string
  email: string
  firstName: string
  lastName: string
  image: string
}

export interface SessionUser {
  id: number
  username: string
  email: string
  firstName: string
  lastName: string
  image: string
}

export interface LoginResult extends AuthTokens {
  user: SessionUser
  /** Epoch ms at which the access token should be treated as expired. */
  accessTokenExpiresAt: number
}
