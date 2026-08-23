import mockData from '@/data/mock-data.json'
import type { AppNotification } from '@/types/notification'
import type { Comment, Task } from '@/types/task'
import type { User } from '@/types/user'
import type { Sprint } from '@/types/sprint'

interface MockDataFile {
  users: User[]
  sprints: Sprint[]
  tasks: Task[]
  comments: Comment[]
  notifications: AppNotification[]
}

/**
 * The bundled JSON is trusted assignment data; the cast aligns its inferred
 * (stringly-typed) fields with our discriminated domain types.
 */
export const MOCK_DATA = mockData as unknown as MockDataFile

/** Deep clone so callers can never mutate the seed data in place. */
export function cloneValue<T>(value: T): T {
  return structuredClone(value)
}

/** Current timestamp as ISO - centralised so mutations stay consistent. */
export function nowIso(): string {
  return new Date().toISOString()
}

/** Highest existing numeric id + 1 (works for empty collections too). */
export function nextId(items: Array<{ id: number }>): number {
  return items.reduce((max, item) => Math.max(max, item.id), 0) + 1
}
