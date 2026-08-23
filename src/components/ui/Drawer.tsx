import { type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useEscapeKey, useFocusTrap, useScrollLock } from '@/hooks/useFocusTrap'
import { cn } from '@/lib/utils'

export interface DrawerProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
  /** Max width class for the panel. */
  widthClass?: string
}

/**
 * Right-side slide-over panel with focus trap, Escape handling, overlay
 * click-to-close and scroll locking.
 */
export function Drawer({
  open,
  onClose,
  title,
  children,
  footer,
  widthClass = 'max-w-md',
}: DrawerProps) {
  const containerRef = useFocusTrap(open)
  useEscapeKey(open, onClose)
  useScrollLock(open)

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-40" role="presentation">
      <div
        className="animate-fade-in absolute inset-0 bg-gray-950/60"
        aria-hidden="true"
        onClick={onClose}
      />
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'animate-slide-in-right absolute inset-y-0 right-0 flex w-full flex-col bg-white shadow-xl dark:bg-gray-900',
          widthClass,
        )}
      >
        <header className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-700">
          <h2 className="truncate text-base font-semibold text-gray-900 dark:text-gray-100">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close panel"
            className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>

        {footer ? (
          <footer className="border-t border-gray-200 px-5 py-4 dark:border-gray-700">
            {footer}
          </footer>
        ) : null}
      </div>
    </div>,
    document.body,
  )
}
