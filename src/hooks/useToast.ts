import type { ToastType } from '@/stores/ui.store'
import { useMemo } from 'react'
import { useUiStore } from '@/stores/ui.store'

/** How long a toast stays on screen before auto-dismissing. */
export const TOAST_AUTO_DISMISS_MS = 5000

export interface ToastApi {
  success: (message: string) => void
  error: (message: string) => void
  warning: (message: string) => void
  info: (message: string) => void
  /** Manually removes a toast by id. */
  dismiss: (id: string) => void
}

/**
 * Imperative helpers for raising toasts from any component.
 * Auto-dismisses after TOAST_AUTO_DISMISS_MS.
 *
 * The returned object is referentially stable (zustand actions never change),
 * so it is safe to pass into memoized children or dependency arrays.
 */
export function useToast(): ToastApi {
  const push = useUiStore((state) => state.pushToast)
  const dismiss = useUiStore((state) => state.dismissToast)

  return useMemo<ToastApi>(() => {
    const raise =
      (type: ToastType) =>
      (message: string): void => {
        const id = push(type, message)
        window.setTimeout(() => dismiss(id), TOAST_AUTO_DISMISS_MS)
      }

    return {
      success: raise('success'),
      error: raise('error'),
      warning: raise('warning'),
      info: raise('info'),
      dismiss,
    }
  }, [push, dismiss])
}
