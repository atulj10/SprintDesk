import { useState } from 'react'
import { CheckCheck, X } from 'lucide-react'
import { useNotificationStore } from '@/stores/notification.store'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { NotificationItem } from '@/components/notifications/NotificationItem'

/** How many notifications are listed per page. */
export const NOTIFICATIONS_PAGE_SIZE = 20

interface NotificationPanelProps {
  onClose: () => void
}

/**
 * Dropdown panel: latest 20 notifications per page with pagination,
 * per-item read state and a mark-all action.
 */
export function NotificationPanel({ onClose }: NotificationPanelProps) {
  const notifications = useNotificationStore((state) => state.notifications)
  const markAllRead = useNotificationStore((state) => state.markAllRead)
  const unreadCount = useNotificationStore((state) => state.notifications.reduce(
    (count, item) => count + (item.read ? 0 : 1),
    0,
  ))

  const [page, setPage] = useState(0)
  const pageCount = Math.max(1, Math.ceil(notifications.length / NOTIFICATIONS_PAGE_SIZE))
  const safePage = Math.min(page, pageCount - 1)

  const visible = notifications.slice(
    safePage * NOTIFICATIONS_PAGE_SIZE,
    (safePage + 1) * NOTIFICATIONS_PAGE_SIZE,
  )

  return (
    <div
      role="dialog"
      aria-label="Notifications"
      className="absolute right-0 top-full z-40 mt-2 flex max-h-[28rem] w-80 max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900"
    >
      <header className="flex items-center justify-between gap-2 border-b border-gray-200 px-4 py-3 dark:border-gray-700">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Notifications</h2>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={markAllRead}
            disabled={unreadCount === 0}
            aria-label="Mark all notifications as read"
            className="px-2"
          >
            <CheckCheck className="h-4 w-4" aria-hidden="true" />
          </Button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close notifications"
            className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </header>

      <div className="flex-1 space-y-1 overflow-y-auto p-2" aria-live="polite">
        {visible.length === 0 ? (
          <EmptyState title="No notifications yet" description="New activity will appear here." />
        ) : (
          visible.map((notification) => (
            <NotificationItem key={notification.id} notification={notification} />
          ))
        )}
      </div>

      {pageCount > 1 ? (
        <footer className="flex items-center justify-between border-t border-gray-200 px-4 py-2.5 text-xs dark:border-gray-700">
          <span className="text-gray-500 dark:text-gray-400">
            Page {safePage + 1} of {pageCount}
          </span>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPage(safePage - 1)}
              disabled={safePage === 0}
            >
              Previous
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPage(safePage + 1)}
              disabled={safePage >= pageCount - 1}
            >
              Next
            </Button>
          </div>
        </footer>
      ) : null}
    </div>
  )
}
