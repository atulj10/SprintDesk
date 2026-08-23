import type { Sprint } from '@/types/sprint'
import type { Task, TaskStatus } from '@/types/task'
import {
  PRIORITY_LABELS,
  STATUS_LABELS,
  TASK_PRIORITIES,
  TASK_STATUSES,
} from '@/types/task'

/**
 * Pure analytics selectors. Everything on the analytics page (and the
 * dashboard metrics) derives from these so numbers can never drift from
 * actual board state - no hardcoded chart data anywhere.
 */

export interface SprintVelocityPoint {
  sprintId: number
  name: string
  completed: number
  total: number
}

/** Completed vs total tasks per sprint (uses task.completedAt). */
export function calculateSprintVelocity(tasks: Task[], sprints: Sprint[]): SprintVelocityPoint[] {
  return sprints.map((sprint) => {
    const inSprint = tasks.filter((task) => task.sprintId === sprint.id)
    const completed = inSprint.filter((task) => task.status === 'done' && task.completedAt !== null)
    return {
      sprintId: sprint.id,
      name: sprint.name,
      completed: completed.length,
      total: inSprint.length,
    }
  })
}

export interface StatusDistributionPoint {
  status: TaskStatus
  label: string
  count: number
}

/** Distribution across Backlog / In Progress / Review / Done. */
export function calculateStatusDistribution(tasks: Task[]): StatusDistributionPoint[] {
  return TASK_STATUSES.map((status) => ({
    status,
    label: STATUS_LABELS[status],
    count: tasks.filter((task) => task.status === status).length,
  }))
}

export interface PriorityBreakdownPoint {
  /** Status column this row represents (chart x-axis). */
  status: TaskStatus
  label: string
  high: number
  medium: number
  low: number
}

/**
 * Priority distribution across columns: one row per status, one series per
 * priority - rendered as a stacked bar chart.
 */
export function calculatePriorityBreakdown(tasks: Task[]): PriorityBreakdownPoint[] {
  return TASK_STATUSES.map((status) => {
    const inStatus = tasks.filter((task) => task.status === status)
    return {
      status,
      label: STATUS_LABELS[status],
      high: inStatus.filter((task) => task.priority === 'high').length,
      medium: inStatus.filter((task) => task.priority === 'medium').length,
      low: inStatus.filter((task) => task.priority === 'low').length,
    }
  })
}

export interface CompletionTrendPoint {
  date: string
  label: string
  count: number
}

/** Tasks completed per day over the trailing `days` window (inclusive today). */
export function calculateCompletionTrend(tasks: Task[], days = 14): CompletionTrendPoint[] {
  const points: CompletionTrendPoint[] = []
  const today = new Date()
  today.setHours(23, 59, 59, 999)

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const dayEnd = new Date(today)
    dayEnd.setDate(dayEnd.getDate() - offset)
    const dayStart = new Date(dayEnd)
    dayStart.setHours(0, 0, 0, 0)

    const count = tasks.filter((task) => {
      if (task.completedAt === null) return false
      const completed = new Date(task.completedAt)
      return completed >= dayStart && completed <= dayEnd
    }).length

    points.push({
      date: dayEnd.toISOString().slice(0, 10),
      label: dayEnd.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      count,
    })
  }

  return points
}

/** Reusable priority series metadata for the breakdown chart legend. */
export const PRIORITY_SERIES = TASK_PRIORITIES.map((priority) => ({
  key: priority,
  label: PRIORITY_LABELS[priority],
}))
