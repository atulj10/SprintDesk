import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { queryKeys } from '@/lib/queryKeys'
import { notificationService } from '@/services/notification.service'
import { useNotificationStore } from '@/stores/notification.store'
import { useAuthStore } from '@/stores/auth.store'
import { useUiStore } from '@/stores/ui.store'

/** Poll JSONPlaceholder every 30s while the tab is visible. */
export const NOTIFICATION_POLL_INTERVAL_MS = 30_000

function useTabVisibility(): boolean {
  const [isVisible, setIsVisible] = useState(
    () => document.visibilityState === 'visible',
  )

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(document.visibilityState === 'visible')
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  return isVisible
}

/**
 * Owns the ENTIRE notification data lifecycle so UI components stay dumb:
 * 1. hydrates initial notifications from mock-data.json (once)
 * 2. polls JSONPlaceholder via TanStack Query - paused when the tab is hidden
 *    (Page Visibility API) and when logged out
 * 3. ingests new items into the persistent store (dedupe by id)
 * 4. raises a toast for new arrivals while the panel is closed
 */
export function useNotifications(): void {
  const isAuthenticated = useAuthStore((state) => state.status === 'authenticated')
  const hydrateInitial = useNotificationStore((state) => state.hydrateInitial)
  const isPanelOpen = useUiStore((state) => state.isNotificationPanelOpen)
  const isVisible = useTabVisibility()

  // 1. Initial bundled notifications.
  const initialQuery = useQuery({
    queryKey: queryKeys.notificationsInitial,
    queryFn: () => notificationService.getInitialNotifications(),
    enabled: isAuthenticated,
    staleTime: Number.POSITIVE_INFINITY,
  })

  useEffect(() => {
    if (initialQuery.data) hydrateInitial(initialQuery.data)
  }, [initialQuery.data, hydrateInitial])

  // 2. Polling - TanStack Query owns lifecycle/caching/refetching.
  const pollQuery = useQuery({
    queryKey: queryKeys.notificationsPoll,
    queryFn: () => {
      const knownIds = useNotificationStore.getState().knownIds
      return notificationService.pollNotifications(knownIds)
    },
    enabled: isAuthenticated && isVisible,
    refetchInterval: isVisible ? NOTIFICATION_POLL_INTERVAL_MS : false,
    refetchIntervalInBackground: false,
    staleTime: 0,
  })

  // 3 + 4. Ingest results; toast about genuinely new arrivals.
  useEffect(() => {
    if (!pollQuery.data || pollQuery.data.length === 0) return
    const added = useNotificationStore.getState().ingest(pollQuery.data)
    if (added > 0 && !isPanelOpen) {
      useUiStore.getState().pushToast('info', 'New notification received')
    }
  }, [pollQuery.data, isPanelOpen])
}
