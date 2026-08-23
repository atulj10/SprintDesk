import type { TaskPriority } from '@/types/task'
import { create } from 'zustand'

/**
 * Board UI state (Zustand): filters, drawer/modal visibility and the task
 * staged for deletion. Task DATA itself lives in the TanStack Query cache,
 * backed by the persistent task repository - it is deliberately NOT
 * duplicated here.
 */

export type PriorityFilter = TaskPriority | 'all'
export type AssigneeFilter = number | 'all'

export interface BoardFilters {
  priority: PriorityFilter
  assigneeId: AssigneeFilter
}

interface BoardState {
  filters: BoardFilters
  selectedTaskId: number | null
  isTaskDrawerOpen: boolean
  isCreateModalOpen: boolean
  /** Task staged in the delete-confirmation dialog, if any. */
  taskPendingDeletion: { id: number; title: string } | null

  setPriorityFilter: (priority: PriorityFilter) => void
  setAssigneeFilter: (assigneeId: AssigneeFilter) => void
  clearFilters: () => void
  openTaskDrawer: (taskId: number) => void
  closeTaskDrawer: () => void
  setCreateModalOpen: (open: boolean) => void
  requestDeleteTask: (task: { id: number; title: string }) => void
  cancelDeleteTask: () => void
}

const DEFAULT_FILTERS: BoardFilters = { priority: 'all', assigneeId: 'all' }

export const useBoardStore = create<BoardState>()((set) => ({
  filters: DEFAULT_FILTERS,
  selectedTaskId: null,
  isTaskDrawerOpen: false,
  isCreateModalOpen: false,
  taskPendingDeletion: null,

  setPriorityFilter: (priority) =>
    set((state) => ({ filters: { ...state.filters, priority } })),
  setAssigneeFilter: (assigneeId) =>
    set((state) => ({ filters: { ...state.filters, assigneeId } })),
  clearFilters: () => set({ filters: DEFAULT_FILTERS }),

  openTaskDrawer: (taskId) => set({ selectedTaskId: taskId, isTaskDrawerOpen: true }),
  closeTaskDrawer: () => set({ isTaskDrawerOpen: false, selectedTaskId: null }),
  setCreateModalOpen: (open) => set({ isCreateModalOpen: open }),

  requestDeleteTask: (task) => set({ taskPendingDeletion: task }),
  cancelDeleteTask: () => set({ taskPendingDeletion: null }),
}))

/** Pure filter predicate used by the board page. */
export function matchesBoardFilters(
  task: { priority: string; assigneeId: number },
  filters: BoardFilters,
): boolean {
  return (
    (filters.priority === 'all' || task.priority === filters.priority) &&
    (filters.assigneeId === 'all' || task.assigneeId === filters.assigneeId)
  )
}
