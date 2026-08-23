import { create } from 'zustand'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastItem {
  id: string
  type: ToastType
  message: string
}

let toastCounter = 0

function nextToastId(): string {
  toastCounter += 1
  return `toast-${toastCounter}`
}

interface UiState {
  toasts: ToastItem[]
  isMobileNavOpen: boolean
  /** Tracked so the polling layer can suppress "new notification" toasts. */
  isNotificationPanelOpen: boolean

  pushToast: (type: ToastType, message: string) => string
  dismissToast: (id: string) => void
  setMobileNavOpen: (open: boolean) => void
  setNotificationPanelOpen: (open: boolean) => void
}

/**
 * Shared application UI state. Component-local state stays in React; only
 * state that must be reachable from hooks/services (toasts) or shared across
 * the layout shell (mobile nav) lives here.
 */
export const useUiStore = create<UiState>()((set) => ({
  toasts: [],
  isMobileNavOpen: false,
  isNotificationPanelOpen: false,

  pushToast: (type, message) => {
    const id = nextToastId()
    set((state) => ({ toasts: [...state.toasts, { id, type, message }] }))
    return id
  },

  dismissToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),

  setMobileNavOpen: (open) => set({ isMobileNavOpen: open }),
  setNotificationPanelOpen: (open) => set({ isNotificationPanelOpen: open }),
}))
