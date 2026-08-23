import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import type { Task, TaskStatus } from '@/types/task'
import { STATUS_LABELS } from '@/types/task'
import { SortableTaskCard } from '@/components/board/TaskCard'
import { cn } from '@/lib/utils'

const COLUMN_ACCENTS: Record<TaskStatus, string> = {
  backlog: 'bg-gray-400',
  'in-progress': 'bg-blue-500',
  review: 'bg-purple-500',
  done: 'bg-emerald-500',
}

export interface BoardColumnProps {
  status: TaskStatus
  tasks: Task[]
  usersById: Map<number, { name: string; avatar: string }>
  onOpenTask?: (taskId: number) => void
}

/**
 * One Kanban column. The whole column is also a droppable target so cards can
 * be dropped into empty columns or below the last card.
 */
export function BoardColumn({ status, tasks, usersById, onOpenTask }: BoardColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: `column:${status}`, data: { status } })

  return (
    <section
      aria-labelledby={`column-${status}-heading`}
      className="flex w-[280px] shrink-0 snap-start flex-col rounded-xl bg-gray-100/80 dark:bg-gray-900 lg:h-[calc(100vh-13rem)]"
    >
      <header className="flex items-center justify-between gap-2 px-3 pt-3 pb-2">
        <h2
          id={`column-${status}-heading`}
          className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200"
        >
          <span className={cn('h-2 w-2 rounded-full', COLUMN_ACCENTS[status])} aria-hidden="true" />
          {STATUS_LABELS[status]}
        </h2>
        <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
          {tasks.length}
          <span className="sr-only"> tasks</span>
        </span>
      </header>

      <div
        ref={setNodeRef}
        className={cn(
          'flex min-h-[6rem] flex-1 flex-col gap-2 overflow-y-auto rounded-lg px-2 pb-3 transition-colors',
          isOver && 'bg-indigo-50/80 ring-1 ring-inset ring-indigo-300 dark:bg-indigo-950/30 dark:ring-indigo-700',
        )}
      >
        <SortableContext items={tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => {
            const assignee = usersById.get(task.assigneeId)
            return (
              <SortableTaskCard
                key={task.id}
                task={task}
                assigneeName={assignee?.name}
                assigneeAvatar={assignee?.avatar}
                onOpen={onOpenTask}
              />
            )
          })}
        </SortableContext>

        {tasks.length === 0 ? (
          <p className="rounded-lg border border-dashed border-gray-300 p-4 text-center text-xs text-gray-400 dark:border-gray-700 dark:text-gray-500">
            No tasks
          </p>
        ) : null}
      </div>
    </section>
  )
}
