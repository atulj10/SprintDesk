import { useEffect, useRef } from 'react'
import { Bell } from 'lucide-react'
import { useUiStore } from '@/stores/ui.store'
import { selectUnreadCount, useNotificationStore } from '@/stores/notification.store'
import { NotificationPanel } from '@/components/notifications/NotificationPanel'

/**
 * Header notification bell. Pure presentation: data/polling lives in
 * useNotifications; open/close state is shared UI state so the polling layer
 * can suppress toasts while the panel is visible.
 */
export function NotificationBell() {
  const unreadCount = useNotificationStore(selectUnreadCount)
  const isOpen = useUiStore((state) => state.isNotificationPanelOpen)
  const setPanelOpen = useUiStore((state) => state.setNotificationPanelOpen)
  const containerRef = useRef<HTMLDivElement>(null)

  // Close when clicking outside of the bell/panel.
  useEffect(() => {
    if (!isOpen) return
    const handlePointerDown = (event: MouseEvent) => {
      if (
        containerRef.current &&
        event.target instanceof Node &&
        !containerRef.current.contains(event.target)
      ) {
        setPanelOpen(false)
      }
    }
    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [isOpen, setPanelOpen])

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setPanelOpen(!isOpen)}
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        className="relative rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
      >
        <Bell className="h-5 w-5" aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
            <span className="sr-only">unread notifications</span>
          </span>
        )}
      </button>

      {isOpen && <NotificationPanel onClose={() => setPanelOpen(false)} />}
    </div>
  )
}
