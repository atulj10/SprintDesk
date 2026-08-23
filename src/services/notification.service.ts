import { apiRequest } from '@/services/api/apiClient'
import { MOCK_DATA } from '@/data/dataSource'
import { JSONPLACEHOLDER_BASE_URL } from '@/lib/env'
import { delay } from '@/lib/async'
import {
  NOTIFICATION_TYPES,
  type AppNotification,
  type NotificationType,
} from '@/types/notification'

/** Number of posts requested per poll from JSONPlaceholder. */
export const POLL_LIMIT = 5

const LATENCY_MS = 200

/**
 * Raw JSONPlaceholder post shape. Kept PRIVATE to this module - the rest of
 * the app only ever sees our own AppNotification type.
 */
interface RemotePost {
  userId: number
  id: number
  title: string
  body: string
}

function capitalizeWords(text: string): string {
  return text
    .split(' ')
    .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : ''))
    .join(' ')
}

/**
 * Maps a remote post onto our notification domain model. The mapping is
 * deterministic so dedupe-by-id stays stable across polls.
 */
export function transformPostToNotification(
  post: RemotePost,
  receivedAt: string,
): AppNotification {
  const type: NotificationType = NOTIFICATION_TYPES[post.id % NOTIFICATION_TYPES.length]
  return {
    id: post.id,
    title: capitalizeWords(post.title.trim()),
    message: post.body.replace(/\s+/g, ' ').trim(),
    type,
    read: false,
    createdAt: receivedAt,
  }
}

export const notificationService = {
  /** Seed notifications bundled with mock-data.json. */
  async getInitialNotifications(): Promise<AppNotification[]> {
    await delay(LATENCY_MS)
    return structuredClone(MOCK_DATA.notifications)
  },

  /**
   * Polls JSONPlaceholder for "activity" posts and returns ONLY genuinely new
   * notifications (ids not present in knownIds), already transformed into
   * AppNotification shape.
   */
  async pollNotifications(knownIds: readonly number[]): Promise<AppNotification[]> {
    const posts = await apiRequest<RemotePost[]>(
      `${JSONPLACEHOLDER_BASE_URL}/posts?_limit=${POLL_LIMIT}`,
    )
    const receivedAt = new Date().toISOString()
    const known = new Set(knownIds)
    return posts
      .map((post) => transformPostToNotification(post, receivedAt))
      .filter((notification) => !known.has(notification.id))
  },
}
