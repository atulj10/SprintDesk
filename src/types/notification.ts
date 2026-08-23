export const NOTIFICATION_TYPES = ['task', 'review', 'system'] as const

export type NotificationType = (typeof NOTIFICATION_TYPES)[number]

export interface AppNotification {
  id: number
  title: string
  message: string
  type: NotificationType
  read: boolean
  createdAt: string
}
