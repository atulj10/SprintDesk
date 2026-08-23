import { cn } from '@/lib/utils'

/**
 * Full-screen loading state used during session validation and route-level
 * code splitting so the app never shows a blank screen.
 */
export function FullScreenLoader({ label = 'Loading SprintDesk…' }: { label?: string }) {
  return (
    <div
      role="status"
      className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50 dark:bg-gray-950"
    >
      <span
        className={cn(
          'h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent',
        )}
        aria-hidden="true"
      />
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
    </div>
  )
}
