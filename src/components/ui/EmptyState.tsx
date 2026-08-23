import type { ReactNode } from 'react'
import { Button } from '@/components/ui/Button'

export interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
}

export function EmptyState({ icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-gray-300 px-6 py-12 text-center dark:border-gray-700">
      {icon ? <div className="text-gray-400 dark:text-gray-500">{icon}</div> : null}
      <div>
        <p className="font-medium text-gray-900 dark:text-gray-100">{title}</p>
        {description ? (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
        ) : null}
      </div>
      {actionLabel && onAction ? (
        <Button size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  )
}
