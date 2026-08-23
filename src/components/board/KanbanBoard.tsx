import { useMemo, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import type { Task, TaskStatus } from '@/types/task'
import { TASK_STATUSES } from '@/types/task'
import { BoardColumn } from '@/components/board/BoardColumn'
import { TaskCard } from '@/components/board/TaskCard'
import { useMoveTask } from '@/hooks/useTasks'
import { useToast } from '@/hooks/useToast'

type ColumnMap = Record<TaskStatus, Task[]>

const COLUMN_DROPPABLE_PREFIX = 'column:'

function statusFromDroppableId(id: string): TaskStatus | null {
  if (!id.startsWith(COLUMN_DROPPABLE_PREFIX)) return null
  const status = id.slice(COLUMN_DROPPABLE_PREFIX.length) as TaskStatus
  return TASK_STATUSES.includes(status) ? status : null
}

function buildColumns(tasks: Task[]): ColumnMap {
  const map = {} as ColumnMap
  for (const status of TASK_STATUSES) {
    map[status] = tasks
      .filter((task) => task.status === status)
      .sort((a, b) => a.order - b.order || a.id - b.id)
  }
  return map
}

/**
 * Moves `activeId` so it sits relative to `overId` (a task id or a column
 * droppable id) inside a copied column map. Pure - returns a new map.
 */
function applyDragPreview(map: ColumnMap, activeId: number, overIdRaw: number | string): ColumnMap | null {
  const next: ColumnMap = {
    backlog: [...map.backlog],
    'in-progress': [...map['in-progress']],
    review: [...map.review],
    done: [...map.done],
  }

  let fromStatus: TaskStatus | null = null
  for (const status of TASK_STATUSES) {
    if (next[status].some((task) => task.id === activeId)) {
      fromStatus = status
      break
    }
  }
  if (!fromStatus) return null

  let toStatus: TaskStatus | undefined
  let overIndexInDest = -1
  const columnStatus = typeof overIdRaw === 'string' ? statusFromDroppableId(overIdRaw) : null

  if (columnStatus !== null) {
    toStatus = columnStatus
    overIndexInDest = next[toStatus].length
  } else {
    const overTaskId = Number(overIdRaw)
    for (const status of TASK_STATUSES) {
      const index = next[status].findIndex((task) => task.id === overTaskId)
      if (index !== -1) {
        toStatus = status
        overIndexInDest = index
        break
      }
    }
    if (toStatus === undefined) return null
  }

  const activeIndex = next[fromStatus].findIndex((task) => task.id === activeId)
  const [moved] = next[fromStatus].splice(activeIndex, 1)

  let insertIndex = overIndexInDest
  if (fromStatus === toStatus && activeIndex < insertIndex) insertIndex -= 1
  insertIndex = Math.min(Math.max(insertIndex, 0), next[toStatus].length)

  moved.status = toStatus
  moved.order = insertIndex + 1
  next[toStatus].splice(insertIndex, 0, moved)

  // Keep orders gapless inside both affected columns.
  next[fromStatus] = next[fromStatus].map((task, index) => ({ ...task, order: index + 1 }))
  next[toStatus] = next[toStatus].map((task, index) => ({ ...task, order: index + 1 }))

  return next
}

export interface KanbanBoardProps {
  tasks: Task[]
  usersById: Map<number, { name: string; avatar: string }>
  onOpenTask?: (taskId: number) => void
}

/**
 * Four-column sprint board with cross-column drag & drop.
 * Drag previews are local state; the final position is committed through
 * moveTask (which recalculates order values and persists them).
 */
export function KanbanBoard({ tasks, usersById, onOpenTask }: KanbanBoardProps) {
  const computedColumns = useMemo(() => buildColumns(tasks), [tasks])
  const [dragColumns, setDragColumns] = useState<ColumnMap | null>(null)
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const columns = dragColumns ?? computedColumns

  const moveTask = useMoveTask()
  const toast = useToast()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  // Note: drag previews are always cleared synchronously in onDragEnd /
  // onDragCancel / mutation error paths, so no reset effect is needed.

  const handleDragStart = (event: DragStartEvent) => {
    const id = Number(event.active.id)
    setActiveTask(
      TASK_STATUSES.map((status) => columns[status])
        .flat()
        .find((task) => task.id === id) ?? null,
    )
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return
    setDragColumns((current) =>
      applyDragPreview(current ?? computedColumns, Number(active.id), over.id),
    )
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    const finalColumns = dragColumns

    setActiveTask(null)

    if (!over || !finalColumns) {
      setDragColumns(null)
      return
    }

    // Locate the dragged card's final position in the preview map.
    const taskId = Number(active.id)
    let targetStatus: TaskStatus | null = null
    let targetOrder = 0
    for (const status of TASK_STATUSES) {
      const index = finalColumns[status].findIndex((task) => task.id === taskId)
      if (index !== -1) {
        targetStatus = status
        targetOrder = index + 1
        break
      }
    }

    setDragColumns(null)

    const original = tasks.find((task) => task.id === taskId)
    if (!targetStatus || !original) return
    if (original.status === targetStatus && original.order === targetOrder) return

    moveTask.mutate(
      { taskId, status: targetStatus, order: targetOrder },
      { onError: () => toast.error('Could not move the task. Please try again.') },
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={() => {
        setActiveTask(null)
        setDragColumns(null)
      }}
    >
      <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 lg:overflow-x-visible">
        {TASK_STATUSES.map((status) => (
          <BoardColumn
            key={status}
            status={status}
            tasks={columns[status]}
            usersById={usersById}
            onOpenTask={onOpenTask}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={null}>
        {activeTask ? (
          <div className="w-[264px] rotate-1 cursor-grabbing opacity-90 shadow-xl">
            <TaskCard
              task={activeTask}
              assigneeName={usersById.get(activeTask.assigneeId)?.name}
              assigneeAvatar={usersById.get(activeTask.assigneeId)?.avatar}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
