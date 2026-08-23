/** Formats an ISO date/datetime as a short human readable date, e.g. "Aug 22, 2026". */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

/** Compact date without the year, used on task cards, e.g. "Aug 22". */
export function formatShortDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

/** Formats an ISO datetime including the time, e.g. "Aug 22, 2026, 4:20 PM". */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

/**
 * Converts an ISO date into the yyyy-mm-dd value expected by
 * `<input type="date">`, in the local timezone.
 */
export function toDateInputValue(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const year = String(date.getFullYear()).padStart(4, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** A task is overdue when its due date is before today and it is not done. */
export function isOverdue(task: { dueDate: string; status: string }): boolean {
  if (task.status === 'done') return false
  const due = new Date(`${task.dueDate}T23:59:59`)
  if (Number.isNaN(due.getTime())) return false
  return due.getTime() < Date.now()
}

/** Compact relative timestamp, e.g. "just now", "5m ago", "3h ago", "2d ago". */
export function timeAgo(iso: string): string {
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return ''
  const seconds = Math.max(0, Math.floor((Date.now() - then) / 1000))
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

/** Whole days between now and the given ISO date (negative when in the past). */
export function daysUntil(iso: string): number {
  const target = new Date(iso).getTime()
  if (Number.isNaN(target)) return 0
  const startOfToday = new Date().setHours(0, 0, 0, 0)
  return Math.round((target - startOfToday) / (1000 * 60 * 60 * 24))
}
