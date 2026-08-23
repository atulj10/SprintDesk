import { useMemo } from 'react'

import {
  calculateCompletionTrend,
  calculatePriorityBreakdown,
  calculateSprintVelocity,
  calculateStatusDistribution,
} from '@/features/analytics/selectors'
import {
  ChartCard,
  CompletionTrendChart,
  PriorityBreakdownChart,
  SprintVelocityChart,
  TaskStatusChart,
} from '@/components/analytics/AnalyticsCharts'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { useTasks } from '@/hooks/useTasks'
import { useSprints } from '@/hooks/useSprints'

/**
 * /analytics - four live charts derived purely from current board state via
 * selectors, so they react to every create/move/complete/delete.
 */
export default function AnalyticsPage() {
  const tasksQuery = useTasks()
  const sprintsQuery = useSprints()

  const tasks = useMemo(() => tasksQuery.data ?? [], [tasksQuery.data])
  const sprints = useMemo(() => sprintsQuery.data ?? [], [sprintsQuery.data])

  const velocity = useMemo(
    () => calculateSprintVelocity(tasks, sprints),
    [tasks, sprints],
  )
  const statusDistribution = useMemo(() => calculateStatusDistribution(tasks), [tasks])
  const priorityBreakdown = useMemo(() => calculatePriorityBreakdown(tasks), [tasks])
  const completionTrend = useMemo(() => calculateCompletionTrend(tasks), [tasks])

  if (tasksQuery.isLoading || sprintsQuery.isLoading) {
    return (
      <div className="space-y-5" aria-hidden="true">
        <Skeleton className="h-9 w-48" />
        <div className="grid gap-6 lg:grid-cols-2">
          {[0, 1, 3, 4].map((key) => (
            <Skeleton key={key} className="h-80 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (tasksQuery.isError) {
    return (
      <EmptyState
        title="Analytics could not be loaded"
        description={tasksQuery.error instanceof Error ? tasksQuery.error.message : undefined}
        actionLabel="Try again"
        onAction={() => void tasksQuery.refetch()}
      />
    )
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Analytics</h1>

      {tasks.length === 0 ? (
        <EmptyState
          title="No data to visualise yet"
          description="Create tasks on the board and the charts will come to life."
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <ChartCard
            title="Sprint velocity"
            description="Completed tasks per sprint"
          >
            <SprintVelocityChart data={velocity} />
          </ChartCard>

          <ChartCard title="Task status" description="Current distribution across columns">
            <TaskStatusChart data={statusDistribution} />
          </ChartCard>

          <ChartCard title="Priority breakdown" description="Priorities within each column">
            <PriorityBreakdownChart data={priorityBreakdown} />
          </ChartCard>

          <ChartCard
            title="Completion trend"
            description="Tasks completed per day (last 14 days)"
          >
            <CompletionTrendChart data={completionTrend} />
          </ChartCard>
        </div>
      )}
    </div>
  )
}
