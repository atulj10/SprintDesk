/**
 * Thin, crash-proof wrapper around localStorage. All persistence in the app
 * (services + zustand stores) goes through these helpers so storage failures
 * (private mode, quota, disabled cookies) degrade gracefully to memory only.
 */
export function readStorage<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key)
    if (raw === null) return null
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export function writeStorage<T>(key: string, value: T): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage unavailable/full - persisting is best-effort.
  }
}

export function removeStorage(key: string): void {
  try {
    window.localStorage.removeItem(key)
  } catch {
    // Ignore.
  }
}
