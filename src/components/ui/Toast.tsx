import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react'
import { createPortal } from 'react-dom'
import { useUiStore, type ToastType } from '@/stores/ui.store'

const TYPE_STYLES: Record<ToastType, { icon: typeof Info; classes: string; iconClasses: string }> = {
  success: {
    icon: CheckCircle2,
    classes:
      'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-100',
    iconClasses: 'text-emerald-600 dark:text-emerald-400',
  },
  error: {
    icon: XCircle,
    classes:
      'border-red-200 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100',
    iconClasses: 'text-red-600 dark:text-red-400',
  },
  warning: {
    icon: AlertTriangle,
    classes:
      'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100',
    iconClasses: 'text-amber-600 dark:text-amber-400',
  },
  info: {
    icon: Info,
    classes:
      'border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-100',
    iconClasses: 'text-sky-600 dark:text-sky-400',
  },
}

/**
 * Renders the global toast queue. Mount once near the app root.
 * Announced politely via aria-live so screen readers hear new toasts.
 */
export function ToastViewport() {
  const toasts = useUiStore((state) => state.toasts)
  const dismiss = useUiStore((state) => state.dismissToast)

  if (toasts.length === 0) return null

  return createPortal(
    <div
      aria-live="polite"
      aria-label="Notifications"
      className="pointer-events-none fixed bottom-4 right-4 z-[70] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2"
    >
      {toasts.map((toast) => {
        const style = TYPE_STYLES[toast.type]
        const Icon = style.icon
        return (
          <div
            key={toast.id}
            role="status"
            className={`animate-slide-up pointer-events-auto flex items-start gap-3 rounded-lg border p-3 shadow-lg ${style.classes}`}
          >
            <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${style.iconClasses}`} aria-hidden="true" />
            <p className="flex-1 text-sm">{toast.message}</p>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              aria-label="Dismiss notification"
              className="rounded p-0.5 opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        )
      })}
    </div>,
    document.body,
  )
}
