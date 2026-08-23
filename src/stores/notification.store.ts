import type { AppNotification } from '@/types/notification'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Notification state (Zustand + localStorage).
 *
 * Holds the merged notification list (initial mock-data notifications +
 * polled JSONPlaceholder activity), the set of known ids used for
 * deduplication, and read/unread state. Persisted so unread badges survive
 * reloads.
 */

/** Upper bound on stored notifications to keep localStorage small. */
const MAX_NOTIFICATIONS = 100

interface NotificationState {
  notifications: AppNotification[]
  knownIds: number[]
  /** True once initial mock notifications have been merged (persisted). */
  hydrated: boolean

  /** Merges the bundled seed notifications exactly once. */
  hydrateInitial: (items: AppNotification[]) => void
  /** Ingests newly observed notifications; returns how many were new. */
  ingest: (incoming: AppNotification[]) => number
  markRead: (id: number) => void
  markAllRead: () => void
}

function sortNewestFirst(notifications: AppNotification[]): AppNotification[] {
  return [...notifications].sort(
    (a, b) => b.createdAt.localeCompare(a.createdAt) || b.id - a.id,
  )
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      knownIds: [],
      hydrated: false,

      hydrateInitial: (items) => {
        if (get().hydrated) return
        const known = new Set(get().knownIds)
        const existing = get().notifications
        const fresh = items.filter((item) => !known.has(item.id))
        const merged = sortNewestFirst([...existing, ...fresh]).slice(0, MAX_NOTIFICATIONS)
        set({
          notifications: merged,
          knownIds: [...new Set([...existing.map((n) => n.id), ...items.map((n) => n.id)])],
          hydrated: true,
        })
      },

      ingest: (incoming) => {
        if (incoming.length === 0) return 0
        const known = new Set(get().knownIds)
        const fresh = incoming.filter((item) => !known.has(item.id))
        if (fresh.length === 0) return 0

        fresh.forEach((item) => known.add(item.id))
        const merged = sortNewestFirst([...get().notifications, ...fresh]).slice(
          0,
          MAX_NOTIFICATIONS,
        )
        set({ notifications: merged, knownIds: [...known] })
        return fresh.length
      },

      markRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((notification) =>
            notification.id === id ? { ...notification, read: true } : notification,
          ),
        })),

      markAllRead: () =>
        set((state) => ({
          notifications: state.notifications.map((notification) =>
            notification.read ? notification : { ...notification, read: true },
          ),
        })),
    }),
    {
      name: 'sprintdesk.notifications',
      partialize: (state) => ({
        notifications: state.notifications,
        knownIds: state.knownIds,
        hydrated: state.hydrated,
      }),
    },
  ),
)

export function selectUnreadCount(state: NotificationState): number {
  return state.notifications.reduce(
    (count, notification) => count + (notification.read ? 0 : 1),
    0,
  )
}
