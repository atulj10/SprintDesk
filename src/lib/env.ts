interface ViteEnv {
  readonly VITE_DUMMYJSON_BASE_URL?: string
  readonly VITE_JSONPLACEHOLDER_BASE_URL?: string
}

const env = import.meta.env as unknown as ViteEnv

export const DUMMYJSON_BASE_URL = env.VITE_DUMMYJSON_BASE_URL ?? 'https://dummyjson.com'

export const JSONPLACEHOLDER_BASE_URL =
  env.VITE_JSONPLACEHOLDER_BASE_URL ?? 'https://jsonplaceholder.typicode.com'
