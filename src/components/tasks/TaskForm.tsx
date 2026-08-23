import { useState } from 'react'
import type { Task, TaskPriority, TaskStatus } from '@/types/task'
import { PRIORITY_LABELS, STATUS_LABELS, TASK_PRIORITIES, TASK_STATUSES } from '@/types/task'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import type { User } from '@/types/user'
import type { Sprint } from '@/types/sprint'

export interface TaskFormValues {
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  assigneeId: number
  dueDate: string
  sprintId: number
}

export interface TaskFormProps {
  /** When provided the form edits this task; otherwise it creates a new one. */
  initial?: Task
  users: User[]
  sprints: Sprint[]
  defaultSprintId?: number
  submitLabel: string
  isSubmitting: boolean
  onSubmit: (values: TaskFormValues) => void
  onCancel?: () => void
}

interface TaskFormErrors {
  title?: string
  assigneeId?: string
  dueDate?: string
}

/** Shared create/edit task form with client-side validation. */
export function TaskForm({
  initial,
  users,
  sprints,
  defaultSprintId,
  submitLabel,
  isSubmitting,
  onSubmit,
  onCancel,
}: TaskFormProps) {
  const [values, setValues] = useState<TaskFormValues>(() => ({
    title: initial?.title ?? '',
    description: initial?.description ?? '',
    status: initial?.status ?? 'backlog',
    priority: initial?.priority ?? 'medium',
    assigneeId: initial?.assigneeId ?? users[0]?.id ?? 0,
    dueDate: initial?.dueDate ?? '',
    sprintId: initial?.sprintId ?? defaultSprintId ?? sprints[0]?.id ?? 0,
  }))
  const [errors, setErrors] = useState<TaskFormErrors>({})

  const setField = <K extends keyof TaskFormValues>(key: K, value: TaskFormValues[K]) => {
    setValues((current) => ({ ...current, [key]: value }))
  }

  const validate = (): boolean => {
    const nextErrors: TaskFormErrors = {}
    if (values.title.trim().length < 3) {
      nextErrors.title = 'Title must be at least 3 characters'
    }
    if (!Number.isFinite(values.assigneeId) || values.assigneeId <= 0) {
      nextErrors.assigneeId = 'Please choose an assignee'
    }
    if (values.dueDate === '') {
      nextErrors.dueDate = 'Due date is required'
    }
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!validate()) return

    onSubmit({ ...values, title: values.title.trim(), description: values.description.trim() })
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <Input
        label="Title"
        value={values.title}
        onChange={(event) => setField('title', event.target.value)}
        error={errors.title}
        placeholder="e.g. Implement drag and drop"
        required
        autoFocus
      />

      <div>
        <label
          htmlFor="task-description"
          className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Description
        </label>
        <textarea
          id="task-description"
          rows={3}
          value={values.description}
          onChange={(event) => setField('description', event.target.value)}
          placeholder="What needs to be done?"
          className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          label="Status"
          value={values.status}
          onChange={(event) => setField('status', event.target.value as TaskStatus)}
        >
          {TASK_STATUSES.map((status) => (
            <option key={status} value={status}>
              {STATUS_LABELS[status]}
            </option>
          ))}
        </Select>

        <Select
          label="Priority"
          value={values.priority}
          onChange={(event) => setField('priority', event.target.value as TaskPriority)}
        >
          {TASK_PRIORITIES.map((priority) => (
            <option key={priority} value={priority}>
              {PRIORITY_LABELS[priority]}
            </option>
          ))}
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          label="Assignee"
          value={String(values.assigneeId)}
          onChange={(event) => setField('assigneeId', Number(event.target.value))}
          error={errors.assigneeId}
        >
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name}
            </option>
          ))}
        </Select>

        <Select
          label="Sprint"
          value={String(values.sprintId)}
          onChange={(event) => setField('sprintId', Number(event.target.value))}
        >
          {sprints.map((sprint) => (
            <option key={sprint.id} value={sprint.id}>
              {sprint.name}
            </option>
          ))}
        </Select>
      </div>

      <Input
        label="Due date"
        type="date"
        value={values.dueDate}
        onChange={(event) => setField('dueDate', event.target.value)}
        error={errors.dueDate}
      />

      <div className="flex items-center justify-end gap-2 pt-1">
        {onCancel ? (
          <Button variant="secondary" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        ) : null}
        <Button type="submit" isLoading={isSubmitting} loadingText="Saving…">
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
