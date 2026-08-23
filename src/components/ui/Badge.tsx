import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type BadgeTone = 'gray' | 'green' | 'amber' | 'red' | 'blue' | 'purple' | 'sky'

const TONE_CLASSES: Record<BadgeTone, string> = {
  gray: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  green: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300',
  amber: 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300',
  red: 'bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-300',
  blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300',
  purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-300',
  sky: 'bg-sky-100 text-sky-800 dark:bg-sky-900/60 dark:text-sky-300',
}

const DOT_CLASSES: Record<BadgeTone, string> = {
  gray: 'bg-gray-400',
  green: 'bg-emerald-500',
  amber: 'bg-amber-500',
  red: 'bg-red-500',
  blue: 'bg-blue-500',
  purple: 'bg-purple-500',
  sky: 'bg-sky-500',
}

export interface BadgeProps {
  tone?: BadgeTone
  /** Renders a coloured dot in addition to the label (never color-only). */
  dot?: boolean
  children: ReactNode
  className?: string
}

/** Small pill used for statuses and priorities. Always carries a text label. */
export function Badge({ tone = 'gray', dot = false, children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap',
        TONE_CLASSES[tone],
        className,
      )}
    >
      {dot ? (
        <span className={cn('h-1.5 w-1.5 rounded-full', DOT_CLASSES[tone])} aria-hidden="true" />
      ) : null}
      {children}
    </span>
  )
}
