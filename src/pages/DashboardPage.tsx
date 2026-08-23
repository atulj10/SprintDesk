import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, BellRing } from 'lucide-react'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { Badge, type BadgeTone } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import type { Sprint } from '@/types/sprint'
import type { Task, TaskPriority, TaskStatus } from '@/types/task'
import { PRIORITY_LABELS, STATUS_LABELS } from '@/types/task'
import { useTasks } from '@/hooks/useTasks'
import { useUsers } from '@/hooks/useUsers'
import { useSprints } from '@/hooks/useSprints'
import { sprintService } from '@/services/sprint.service'
import { useNotificationStore } from '@/stores/notification.store'
import { formatShortDate, timeAgo } from '@/lib/date'
import { cn } from '@/lib/utils'

const STATUS_TONES: Record<TaskStatus, BadgeTone> = {
  backlog: 'gray',
  'in-progress': 'blue',
  review: 'purple',
  done: 'green',
}

const PRIORITY_BADGE_TONES: Record<TaskPriority, BadgeTone> = {
  high: 'red',
  medium: 'amber',
  low: 'gray',
}

interface StatTileProps {
  label: string
  value: string | number
  toneClass?: string
}

function StatTile({ label, value, toneClass }: StatTileProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
        {label}
      </p>
      <p className={cn('mt-1 text-2xl font-bold text-gray-900 dark:text-gray-50', toneClass)}>
        {value}
      </p>
    </div>
  )
}

function CurrentSprintCard({
  sprint,
  stats,
}: {
  sprint: Sprint | null
  stats: { total: number; done: number; percent: number } | null
}) {
  // Capture "now" once per mount so the render stays pure.
  const [now] = useState(() => Date.now())

  if (!sprint || !stats) {
    return (
      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Current sprint</h2>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">No sprint information available.</p>
      </section>
    )
  }

  const daysLeft = Math.max(
    0,
    Math.ceil((new Date(`${sprint.endDate}T23:59:59`).getTime() - now) / (1000 * 60 * 60 * 24)),
  )

  return (
    <section
      aria-label={`Current sprint: ${sprint.name}`}
      className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900"
    >
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Current sprint</h2>
        <Badge tone="sky">{sprint.name}</Badge>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400">
        {formatShortDate(sprint.startDate)} – {formatShortDate(sprint.endDate)} ·{' '}
        {daysLeft > 0 ? `${daysLeft} day${daysLeft === 1 ? '' : 's'} left` : 'Finished'}
      </p>

      <div>
        <div className="mb-1.5 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>
            {stats.done}/{stats.total} tasks completed
          </span>
          <span className="font-semibold text-gray-700 dark:text-gray-300">{stats.percent}%</span>
        </div>
        <div
          role="progressbar"
          aria-valuenow={stats.percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${sprint.name} progress`}
          className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700"
        >
          <div
            className="h-full rounded-full bg-indigo-600 transition-all duration-500 dark:bg-indigo-400"
            style={{ width: `${stats.percent}%` }}
          />
        </div>
      </div>
    </section>
  )
}

function NotificationSummaryCard({
  unreadCount,
  latest,
}: {
  unreadCount: number
  latest: Array<{ id: number; title: string; createdAt: string }>
}) {
  return (
    <section
      aria-label="Notification summary"
      className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900"
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
          <BellRing className="h-4 w-4 text-indigo-500" aria-hidden="true" />
          Notifications
        </h2>
        <Badge tone={unreadCount > 0 ? 'red' : 'green'}>
          {unreadCount > 0 ? `${unreadCount} unread` : 'All read'}
        </Badge>
      </div>

      {latest.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">Nothing new right now.</p>
      ) : (
        <ul className="space-y-2" role="list">
          {latest.map((notification) => (
            <li key={notification.id} className="flex items-center justify-between gap-3 text-sm">
              <span className="truncate text-gray-700 dark:text-gray-300">{notification.title}</span>
              <time
                className="shrink-0 text-xs text-gray-400 dark:text-gray-500"
                dateTime={notification.createdAt}
              >
                {timeAgo(notification.createdAt)}
              </time>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

/** /dashboard - overview computed entirely from live application data. */
export default function DashboardPage() {
  const tasksQuery = useTasks()
  const usersQuery = useUsers()
  const sprintsQuery = useSprints()
  const notifications = useNotificationStore((state) => state.notifications)

  const tasks = useMemo(() => tasksQuery.data ?? [], [tasksQuery.data])
  const users = useMemo(() => usersQuery.data ?? [], [usersQuery.data])

  const stats = useMemo(() => {
    const total = tasks.length
    const byStatus = (status: TaskStatus) => tasks.filter((task) => task.status === status).length
    const done = byStatus('done')
    return {
      total,
      backlog: byStatus('backlog'),
      inProgress: byStatus('in-progress'),
      review: byStatus('review'),
      done,
      completionPercent: total === 0 ? 0 : Math.round((done / total) * 100),
    }
  }, [tasks])

  const currentSprint = sprintsQuery.data
    ? sprintService.getCurrentSprint(sprintsQuery.data)
    : null

  const currentSprintStats = useMemo(() => {
    if (!currentSprint) return null
    const inSprint = tasks.filter((task) => task.sprintId === currentSprint.id)
    const done = inSprint.filter((task) => task.status === 'done').length
    return {
      total: inSprint.length,
      done,
      percent: inSprint.length === 0 ? 0 : Math.round((done / inSprint.length) * 100),
    }
  }, [currentSprint, tasks])

  const recentTasks = useMemo(
    () => [...tasks].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 6),
    [tasks],
  )

  const unreadCount = notifications.filter((notification) => !notification.read).length
  const latestNotifications = notifications.slice(0, 3)

  const columns = useMemo<Column<Task>[]>(
    () => [
      {
        key: 'title',
        header: 'Task',
        render: (task) => (
          <span className="font-medium text-gray-900 dark:text-gray-100">{task.title}</span>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        render: (task) => (
          <Badge tone={STATUS_TONES[task.status]}>{STATUS_LABELS[task.status]}</Badge>
        ),
      },
      {
        key: 'priority',
        header: 'Priority',
        render: (task) => (
          <Badge tone={PRIORITY_BADGE_TONES[task.priority]} dot>
            {PRIORITY_LABELS[task.priority]}
          </Badge>
        ),
      },
      {
        key: 'assignee',
        header: 'Assignee',
        render: (task) => {
          const user = users.find((candidate) => candidate.id === task.assigneeId)
          return (
            <span className="flex items-center gap-2">
              <Avatar name={user?.name ?? 'Unassigned'} src={user?.avatar} size="sm" />
              <span className="hidden sm:inline">{user?.name ?? 'Unassigned'}</span>
            </span>
          )
        },
      },
      {
        key: 'dueDate',
        header: 'Due',
        render: (task) => (
          <span className="text-gray-500 dark:text-gray-400">{formatShortDate(task.dueDate)}</span>
        ),
      },
    ],
    [users],
  )

  if (tasksQuery.isLoading || usersQuery.isLoading || sprintsQuery.isLoading) {
    return (
      <div className="space-y-5" aria-hidden="true">
        <Skeleton className="h-9 w-48" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
          {[0, 1, 2, 3, 4, 5].map((key) => (
            <Skeleton key={key} className="h-20 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    )
  }

  if (tasksQuery.isError) {
    return (
      <EmptyState
        title="The dashboard could not be loaded"
        description={tasksQuery.error instanceof Error ? tasksQuery.error.message : undefined}
        actionLabel="Try again"
        onAction={() => void tasksQuery.refetch()}
      />
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>

      {/* Metric tiles */}
      <section aria-label="Task metrics" className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <StatTile label="Total tasks" value={stats.total} />
        <StatTile label="Backlog" value={stats.backlog} />
        <StatTile label="In progress" value={stats.inProgress} />
        <StatTile label="Review" value={stats.review} />
        <StatTile
          label="Completed"
          value={stats.done}
          toneClass="text-emerald-600 dark:text-emerald-400"
        />
        <StatTile
          label="Completion"
          value={`${stats.completionPercent}%`}
          toneClass="text-indigo-600 dark:text-indigo-400"
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <CurrentSprintCard sprint={currentSprint} stats={currentSprintStats} />

        <NotificationSummaryCard unreadCount={unreadCount} latest={latestNotifications} />

        <section
          aria-label="Go to board"
          className="hidden flex-col justify-between rounded-xl border border-indigo-200 bg-indigo-50 p-5 shadow-sm dark:border-indigo-800 dark:bg-indigo-950/40 lg:flex"
        >
          <div>
            <h2 className="text-sm font-semibold text-indigo-900 dark:text-indigo-200">
              Ready to plan?
            </h2>
            <p className="mt-1 text-xs text-indigo-700/80 dark:text-indigo-300/80">
              Drag tasks between columns, add new work or dig into details.
            </p>
          </div>
          <Link
            to="/board"
            className="mt-4 inline-flex w-fit items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
          >
            Open board
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </section>
      </div>

      {/* Recent activity */}
      <section aria-label="Recently updated tasks" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Recent activity</h2>
          <Link
            to="/board"
            className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
          >
            View board
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>

        <DataTable
          columns={columns}
          rows={recentTasks}
          rowKey={(task) => task.id}
          caption="Six most recently updated tasks"
          emptyState={
            <EmptyState title="No tasks yet" description="Create your first task on the board." />
          }
        />
      </section>
    </div>
  )
}
