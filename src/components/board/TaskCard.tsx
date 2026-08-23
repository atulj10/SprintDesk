import { memo } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { AlertCircle, CalendarDays } from 'lucide-react'
import type { Task, TaskPriority } from '@/types/task'
import { PRIORITY_LABELS } from '@/types/task'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { formatShortDate, isOverdue } from '@/lib/date'
import { cn } from '@/lib/utils'

const PRIORITY_TONES: Record<TaskPriority, 'red' | 'amber' | 'gray'> = {
  high: 'red',
  medium: 'amber',
  low: 'gray',
}

export interface TaskCardProps {
  task: Task
  assigneeName?: string
  assigneeAvatar?: string
  onOpen?: (taskId: number) => void
}

/**
 * Kanban card. Memoized: with 30+ cards this keeps drag re-renders cheap.
 * Rendered inside a sortable wrapper by the board; also reused in DragOverlay.
 */
export const TaskCard = memo(function TaskCard({
  task,
  assigneeName,
  assigneeAvatar,
  onOpen,
}: TaskCardProps) {
  const overdue = isOverdue(task)

  return (
    <div
      className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm transition-shadow dark:border-gray-700 dark:bg-gray-800"
    >
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <Badge tone={PRIORITY_TONES[task.priority]} dot>
          {PRIORITY_LABELS[task.priority]}
        </Badge>

        <span
          className={cn(
            'inline-flex items-center gap-1 text-xs font-medium',
            overdue ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400',
          )}
          title={overdue ? `Was due ${formatShortDate(task.dueDate)} - overdue` : undefined}
        >
          {overdue ? (
            <>
              <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
              Overdue
              <span className="sr-only">{formatShortDate(task.dueDate)}</span>
            </>
          ) : (
            <>
              <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="sr-only">Due </span>
              {formatShortDate(task.dueDate)}
            </>
          )}
        </span>
      </div>

      <button
        type="button"
        onClick={() => onOpen?.(task.id)}
        disabled={!onOpen}
        className="w-full rounded text-left text-sm font-medium text-gray-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 dark:text-gray-100"
        aria-label={`Open task: ${task.title}`}
      >
        {task.title}
      </button>

      <div className="mt-2.5 flex items-center gap-2">
        <Avatar name={assigneeName ?? 'Unassigned'} src={assigneeAvatar} size="sm" />
        <span className="truncate text-xs text-gray-500 dark:text-gray-400">
          {assigneeName ?? 'Unassigned'}
        </span>
      </div>
    </div>
  )
})

type SortableTaskCardProps = TaskCardProps

/** Wraps TaskCard with dnd-kit sortable behaviour (keyboard accessible). */
export function SortableTaskCard(props: SortableTaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: props.task.id,
  })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn('touch-none', isDragging && 'opacity-40')}
      {...attributes}
      {...listeners}
    >
      <TaskCard {...props} />
    </div>
  )
}
