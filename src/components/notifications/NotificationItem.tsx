import { memo } from 'react'
import type { AppNotification } from '@/types/notification'
import { Badge } from '@/components/ui/Badge'
import { timeAgo } from '@/lib/date'
import { useNotificationStore } from '@/stores/notification.store'
import { cn } from '@/lib/utils'

const TYPE_TONES: Record<AppNotification['type'], 'blue' | 'purple' | 'gray'> = {
  task: 'blue',
  review: 'purple',
  system: 'gray',
}

/**
 * Single notification row. Clicking marks it read.
 * Memoized so polling-driven store updates don't re-render every row.
 */
export const NotificationItem = memo(function NotificationItem({
  notification,
}: {
  notification: AppNotification
}) {
  const markRead = useNotificationStore((state) => state.markRead)

  return (
    <button
      type="button"
      onClick={() => markRead(notification.id)}
      className={cn(
        'flex w-full flex-col items-start gap-1 rounded-lg px-3 py-2.5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500',
        'hover:bg-gray-50 dark:hover:bg-gray-800/60',
        !notification.read && 'bg-indigo-50/70 dark:bg-indigo-950/40',
      )}
    >
      <div className="flex w-full items-center justify-between gap-2">
        <Badge tone={TYPE_TONES[notification.type]}>{notification.type}</Badge>
        <time
          className="text-xs text-gray-400 dark:text-gray-500"
          dateTime={notification.createdAt}
        >
          {timeAgo(notification.createdAt)}
        </time>
      </div>
      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
        {notification.title}
        {!notification.read && (
          <span
            className="ml-2 inline-block h-2 w-2 rounded-full bg-indigo-500 align-middle"
            aria-label="Unread"
          />
        )}
      </p>
      <p className="line-clamp-2 text-xs text-gray-500 dark:text-gray-400">
        {notification.message}
      </p>
    </button>
  )
})
