import mockData from '@/data/mock-data.json'
import type { AppNotification } from '@/types/notification'
import type { User } from '@/types/user'
import type { Sprint } from '@/types/sprint'
import type { Comment } from '@/types/task'
import type { CreateTaskInput, MoveTaskInput, Task, TaskStatus } from '@/types/task'
import { TASK_STATUSES } from '@/types/task'
import { readStorage, writeStorage, removeStorage } from '@/lib/storage'
import { nowIso } from '@/data/dataSource'

interface MockDataFile {
  users: User[]
  sprints: Sprint[]
  tasks: Task[]
  comments: Comment[]
  notifications: AppNotification[]
}

const TASKS_STORAGE_KEY = 'sprintdesk.tasks.v1'

/**
 * Local persistence layer ("database") for tasks. Hydrated once from
 * localStorage, falling back to the bundled mock-data.json seed. Every
 * mutation commits to localStorage so board state survives page refreshes.
 *
 * Kept free of React/Zustand concerns: TanStack Query caches what this layer
 * returns, Zustand never duplicates it.
 */

function seedTasks(): Task[] {
  return structuredClone((mockData as unknown as MockDataFile).tasks)
}

let tasksState: Task[] = hydrate()

function hydrate(): Task[] {
  const stored = readStorage<Task[]>(TASKS_STORAGE_KEY)
  if (Array.isArray(stored)) return stored

  // First run: fall back to the bundled seed. The provided mock-data.json is
  // used exactly as shipped (its `order` values are grouped per sprint, so
  // they repeat within a column) - ordering quirks are normalised HERE at the
  // service boundary rather than by editing assignment data.
  const tasks = seedTasks()
  for (const status of TASK_STATUSES) {
    normalizeColumnIn(tasks, status)
  }
  return tasks
}

function commit(): void {
  writeStorage(TASKS_STORAGE_KEY, tasksState)
}

/**
 * Rewrites `order` as gapless 1..n for one column of `list`, preserving the
 * list's visual ranking (ties broken by id). Mutates the task objects in place.
 */
function normalizeColumnIn(list: Task[], status: TaskStatus): void {
  list
    .filter((task) => task.status === status)
    .sort((a, b) => a.order - b.order || a.id - b.id)
    .forEach((task, index) => {
      task.order = index + 1
    })
}

/** Convenience wrapper operating on the live module state. */
function normalizeColumn(status: TaskStatus): void {
  normalizeColumnIn(tasksState, status)
}

/**
 * Moves a task into `status` at 1-based `targetOrder` within the module state,
 * renormalising both affected columns. Returns the moved task (live reference).
 */
function moveWithinState(
  taskId: number,
  status: TaskStatus,
  targetOrder: number,
): Task | undefined {
  const index = tasksState.findIndex((task) => task.id === taskId)
  if (index === -1) return undefined

  const previousStatus = tasksState[index].status
  // Mutate the LIVE object rather than replacing it with a copy: callers
  // (update/move) keep a usable reference for post-move bookkeeping, and no
  // orphaned duplicate can drift away from committed state.
  const moved = tasksState[index]
  moved.status = status

  const destination = tasksState
    .filter((task) => task.status === status && task.id !== taskId)
    .sort((a, b) => a.order - b.order || a.id - b.id)

  const insertIndex = Math.min(Math.max(targetOrder - 1, 0), destination.length)
  destination.splice(insertIndex, 0, moved)

  // The splice position is authoritative: assign gapless orders immediately so
  // the moved card lands exactly where requested instead of being re-sorted by
  // its stale previous order.
  destination.forEach((task, index) => {
    task.order = index + 1
  })

  const rest = tasksState.filter((task) => task.id !== taskId && task.status !== status)
  tasksState = [...rest, ...destination]

  normalizeColumn(status)
  if (previousStatus !== status) normalizeColumn(previousStatus)

  return moved
}

export const taskRepository = {
  /** Fresh deep copy of every task, as persisted. */
  getAll(): Task[] {
    return structuredClone(tasksState)
  },

  getById(id: number): Task | undefined {
    const found = tasksState.find((task) => task.id === id)
    return found ? structuredClone(found) : undefined
  },

  create(input: CreateTaskInput): Task {
    const timestamp = nowIso()
    const columnLength = tasksState.filter((task) => task.status === input.status).length
    const task: Task = {
      ...input,
      id: tasksState.reduce((max, item) => Math.max(max, item.id), 0) + 1,
      order: columnLength + 1,
      createdAt: timestamp,
      completedAt: null,
      updatedAt: timestamp,
    }
    tasksState.push(task)
    commit()
    return structuredClone(task)
  },

  update(id: number, patch: Partial<CreateTaskInput>): Task | undefined {
    const index = tasksState.findIndex((task) => task.id === id)
    if (index === -1) return undefined

    const current = tasksState[index]
    const statusChanged = patch.status !== undefined && patch.status !== current.status
    const timestamp = nowIso()

    // Apply non-status patches directly; a status change must go through
    // moveWithinState so the previous column is read BEFORE it is overwritten
    // and both affected columns stay gapless.
    const { status, ...fieldPatch } = patch
    Object.assign(current, fieldPatch, { updatedAt: timestamp })

    if (statusChanged && status) {
      moveWithinState(id, status, Number.MAX_SAFE_INTEGER)
    }

    // Completion bookkeeping drives analytics, so it lives here - not in the UI.
    if (current.status === 'done' && !current.completedAt) {
      current.completedAt = timestamp
    } else if (current.status !== 'done') {
      current.completedAt = null
    }

    commit()
    return structuredClone(current)
  },

  move(input: MoveTaskInput): Task | undefined {
    const moved = moveWithinState(input.taskId, input.status, input.order)
    if (!moved) return undefined

    const timestamp = nowIso()
    moved.updatedAt = timestamp
    if (moved.status === 'done' && !moved.completedAt) {
      moved.completedAt = timestamp
    } else if (moved.status !== 'done') {
      moved.completedAt = null
    }

    commit()
    return structuredClone(moved)
  },

  delete(id: number): boolean {
    const victim = tasksState.find((task) => task.id === id)
    if (!victim) return false

    tasksState = tasksState.filter((task) => task.id !== id)
    normalizeColumn(victim.status)
    commit()
    return true
  },
}

/**
 * Test helper: wipes persisted board data and restores the pristine
 * mock-data.json seed (normalised exactly like a first app run).
 */
export function resetTaskRepositoryForTests(): void {
  removeStorage(TASKS_STORAGE_KEY)
  tasksState = hydrate()
}

/**
 * Test helper: simulates an app restart by discarding in-memory state and
 * re-reading whatever is currently persisted.
 */
export function rehydrateTaskRepositoryForTests(): void {
  tasksState = hydrate()
}
