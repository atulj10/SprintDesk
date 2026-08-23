export const TASK_STATUSES = ['backlog', 'in-progress', 'review', 'done'] as const

export type TaskStatus = (typeof TASK_STATUSES)[number]

export const TASK_PRIORITIES = ['low', 'medium', 'high'] as const

export type TaskPriority = (typeof TASK_PRIORITIES)[number]

export const STATUS_LABELS: Record<TaskStatus, string> = {
  backlog: 'Backlog',
  'in-progress': 'In Progress',
  review: 'Review',
  done: 'Done',
}

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
}

export interface Task {
  id: number
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  assigneeId: number
  /** ISO date (yyyy-mm-dd). */
  dueDate: string
  sprintId: number
  /** 1-based position of the task within its status column. */
  order: number
  createdAt: string
  completedAt: string | null
  updatedAt: string
}

export interface CreateTaskInput {
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  assigneeId: number
  dueDate: string
  sprintId: number
}

export type UpdateTaskInput = Partial<Omit<CreateTaskInput, 'sprintId'>>

export interface MoveTaskInput {
  taskId: number
  status: TaskStatus
  /** 1-based target position within the destination column. */
  order: number
}

export interface Comment {
  id: number
  taskId: number
  authorId: number
  message: string
  createdAt: string
}

export interface AddCommentInput {
  taskId: number
  authorId: number
  message: string
}
