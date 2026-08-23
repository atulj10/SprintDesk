import { useMemo } from 'react'
import { Plus } from 'lucide-react'
import { KanbanBoard } from '@/components/board/KanbanBoard'
import { BoardFilters } from '@/components/board/BoardFilters'
import { TaskDrawer } from '@/components/tasks/TaskDrawer'
import { TaskForm, type TaskFormValues } from '@/components/tasks/TaskForm'
import { DeleteTaskDialog } from '@/components/tasks/DeleteTaskDialog'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { matchesBoardFilters } from '@/stores/board.store'
import { useBoardStore } from '@/stores/board.store'
import { useTasks, useCreateTask } from '@/hooks/useTasks'
import { useUsers } from '@/hooks/useUsers'
import { useSprints } from '@/hooks/useSprints'
import { sprintService } from '@/services/sprint.service'
import { useToast } from '@/hooks/useToast'

/**
 * /board - the Kanban page: filters, board, task drawer, create modal and
 * delete confirmation are all orchestrated here.
 */
export default function BoardPage() {
  const tasksQuery = useTasks()
  const usersQuery = useUsers()
  const sprintsQuery = useSprints()

  const filters = useBoardStore((state) => state.filters)
  const setPriorityFilter = useBoardStore((state) => state.setPriorityFilter)
  const setAssigneeFilter = useBoardStore((state) => state.setAssigneeFilter)
  const clearFilters = useBoardStore((state) => state.clearFilters)

  const isCreateModalOpen = useBoardStore((state) => state.isCreateModalOpen)
  const setCreateModalOpen = useBoardStore((state) => state.setCreateModalOpen)

  const selectedTaskId = useBoardStore((state) => state.selectedTaskId)
  const isTaskDrawerOpen = useBoardStore((state) => state.isTaskDrawerOpen)
  const openTaskDrawer = useBoardStore((state) => state.openTaskDrawer)
  const closeTaskDrawer = useBoardStore((state) => state.closeTaskDrawer)

  const requestDeleteTask = useBoardStore((state) => state.requestDeleteTask)

  const createTask = useCreateTask()
  const toast = useToast()

  const tasks = useMemo(() => tasksQuery.data ?? [], [tasksQuery.data])
  const filteredTasks = useMemo(
    () => tasks.filter((task) => matchesBoardFilters(task, filters)),
    [tasks, filters],
  )

  const usersById = useMemo(() => {
    const map = new Map<number, { name: string; avatar: string }>()
    for (const user of usersQuery.data ?? []) {
      map.set(user.id, { name: user.name, avatar: user.avatar })
    }
    return map
  }, [usersQuery.data])

  const selectedTask = selectedTaskId !== null
    ? tasks.find((task) => task.id === selectedTaskId) ?? null
    : null

  const currentSprintId =
    sprintsQuery.data !== undefined ? sprintService.getCurrentSprint(sprintsQuery.data)?.id : undefined

  const handleCreate = (values: TaskFormValues) => {
    createTask.mutate(values, {
      onSuccess: (created) => {
        toast.success(`Task “${created.title}” created`)
        setCreateModalOpen(false)
      },
      onError: () => toast.error('Could not create the task'),
    })
  }

  if (tasksQuery.isLoading) {
    return (
      <div className="space-y-4" aria-hidden="true">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[0, 1, 2, 3].map((key) => (
            <Skeleton key={key} className="h-96 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (tasksQuery.isError) {
    return (
      <EmptyState
        title="The board could not be loaded"
        description={tasksQuery.error instanceof Error ? tasksQuery.error.message : 'Unexpected error'}
        actionLabel="Try again"
        onAction={() => void tasksQuery.refetch()}
      />
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Sprint board</h1>
        <Button onClick={() => setCreateModalOpen(true)}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add task
        </Button>
      </div>

      <BoardFilters
        filters={filters}
        users={usersQuery.data ?? []}
        onPriorityChange={setPriorityFilter}
        onAssigneeChange={setAssigneeFilter}
        onClear={clearFilters}
      />

      {filteredTasks.length === 0 && tasks.length > 0 ? (
        <EmptyState
          title="No tasks match your filters"
          description="Adjust or clear the filters to see the rest of the board."
          actionLabel="Clear filters"
          onAction={clearFilters}
        />
      ) : (
        <KanbanBoard tasks={filteredTasks} usersById={usersById} onOpenTask={openTaskDrawer} />
      )}

      {/* Create task */}
      <Modal
        open={isCreateModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create new task"
        size="lg"
      >
        {(usersQuery.data?.length ?? 0) > 0 && (sprintsQuery.data?.length ?? 0) > 0 ? (
          <TaskForm
            users={usersQuery.data ?? []}
            sprints={sprintsQuery.data ?? []}
            defaultSprintId={currentSprintId}
            submitLabel="Create task"
            isSubmitting={createTask.isPending}
            onSubmit={handleCreate}
            onCancel={() => setCreateModalOpen(false)}
          />
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading form data…</p>
        )}
      </Modal>

      {/* Task detail drawer */}
      <TaskDrawer
        task={selectedTask}
        open={isTaskDrawerOpen}
        onClose={closeTaskDrawer}
        onRequestDelete={requestDeleteTask}
      />

      {/* Delete confirmation */}
      <DeleteTaskDialog />
    </div>
  )
}
