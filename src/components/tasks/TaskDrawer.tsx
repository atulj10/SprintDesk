import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import type { Task } from '@/types/task'
import { STATUS_LABELS, PRIORITY_LABELS } from '@/types/task'
import { Drawer } from '@/components/ui/Drawer'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Skeleton, SkeletonText } from '@/components/ui/Skeleton'
import { TaskForm, type TaskFormValues } from '@/components/tasks/TaskForm'
import { TaskComments } from '@/components/tasks/TaskComments'
import { useSprints } from '@/hooks/useSprints'
import { useUsers } from '@/hooks/useUsers'
import { useUpdateTask } from '@/hooks/useTasks'
import { useToast } from '@/hooks/useToast'
import { formatDate, formatDateTime } from '@/lib/date'

export interface TaskDrawerProps {
  task: Task | null
  open: boolean
  onClose: () => void
  onRequestDelete: (task: { id: number; title: string }) => void
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5">
      <dt className="shrink-0 text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
        {label}
      </dt>
      <dd className="text-right text-sm text-gray-800 dark:text-gray-200">{children}</dd>
    </div>
  )
}

/**
 * Right-side task detail drawer with view + edit modes and comments.
 * Focus management, Escape handling and scroll locking come from Drawer.
 */
export function TaskDrawer({ task, open, onClose, onRequestDelete }: TaskDrawerProps) {
  const { data: users = [] } = useUsers()
  const { data: sprints = [] } = useSprints()
  const updateTask = useUpdateTask()
  const toast = useToast()

  const [isEditing, setIsEditing] = useState(false)
  const [lastOpen, setLastOpen] = useState(open)

  // Reset edit mode whenever the drawer transitions to closed (render-time
  // state adjustment per React docs - avoids an effect).
  if (lastOpen !== open) {
    setLastOpen(open)
    if (!open) setIsEditing(false)
  }

  const assignee = users.find((user) => user.id === task?.assigneeId)
  const sprint = sprints.find((candidate) => candidate.id === task?.sprintId)

  const handleSave = (values: TaskFormValues) => {
    if (!task) return
    updateTask.mutate(
      {
        id: task.id,
        patch: {
          title: values.title,
          description: values.description,
          status: values.status,
          priority: values.priority,
          assigneeId: values.assigneeId,
          dueDate: values.dueDate,
        },
      },
      {
        onSuccess: () => {
          toast.success('Task updated')
          setIsEditing(false)
        },
        onError: () => toast.error('Could not update the task'),
      },
    )
  }

  return (
    <Drawer
      open={open && task !== null}
      onClose={onClose}
      title={isEditing ? 'Edit task' : (task?.title ?? 'Task')}
      footer={
        !isEditing && task ? (
          <div className="flex items-center justify-between gap-2">
            <Button
              variant="ghost"
              onClick={() => onRequestDelete({ id: task.id, title: task.title })}
              className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/50"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Delete
            </Button>
            <Button variant="secondary" onClick={() => setIsEditing(true)}>
              <Pencil className="h-4 w-4" aria-hidden="true" />
              Edit
            </Button>
          </div>
        ) : null
      }
    >
      {task === null ? null : isEditing ? (
        <TaskForm
          initial={task}
          users={users}
          sprints={sprints}
          submitLabel="Save changes"
          isSubmitting={updateTask.isPending}
          onSubmit={(values) => handleSave(values)}
          onCancel={() => setIsEditing(false)}
        />
      ) : (
        <div className="space-y-6">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge tone={task.priority === 'high' ? 'red' : task.priority === 'medium' ? 'amber' : 'gray'} dot>
                {PRIORITY_LABELS[task.priority]} priority
              </Badge>
              <Badge
                tone={
                  task.status === 'done'
                    ? 'green'
                    : task.status === 'review'
                      ? 'purple'
                      : task.status === 'in-progress'
                        ? 'blue'
                        : 'gray'
                }
              >
                {STATUS_LABELS[task.status]}
              </Badge>
            </div>
            <h3 className="text-lg font-semibold leading-snug text-gray-900 dark:text-gray-100">
              {task.title}
            </h3>
            <p className="mt-2 whitespace-pre-line text-sm text-gray-600 dark:text-gray-300">
              {task.description || 'No description provided.'}
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 p-3 dark:border-gray-700">
            <dl className="divide-y divide-gray-100 dark:divide-gray-800">
              <DetailRow label="Assignee">
                <span className="inline-flex items-center justify-end gap-2">
                  <Avatar name={assignee?.name ?? 'Unassigned'} src={assignee?.avatar} size="sm" />
                  {assignee?.name ?? 'Unassigned'}
                </span>
              </DetailRow>
              <DetailRow label="Sprint">{sprint?.name ?? `Sprint ${task.sprintId}`}</DetailRow>
              <DetailRow label="Due date">{formatDate(task.dueDate)}</DetailRow>
              <DetailRow label="Created">{formatDateTime(task.createdAt)}</DetailRow>
              <DetailRow label="Updated">{formatDateTime(task.updatedAt)}</DetailRow>
              <DetailRow
                label="Completed"
              >
                {task.completedAt ? formatDateTime(task.completedAt) : '—'}
              </DetailRow>
            </dl>
          </div>

          <TaskComments taskId={task.id} />
        </div>
      )}
    </Drawer>
  )
}

/** Loading placeholder used while the selected task is being fetched. */
export function TaskDrawerSkeleton() {
  return (
    <div className="space-y-4" aria-hidden="true">
      <Skeleton className="h-5 w-24" />
      <Skeleton className="h-7 w-3/4" />
      <SkeletonText lines={3} />
      <Skeleton className="h-32 w-full rounded-xl" />
    </div>
  )
}
