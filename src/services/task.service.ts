import { ApiError } from '@/services/api/apiClient'
import { taskRepository } from '@/services/task.repository'
import { deleteCommentsForTask } from '@/services/comment.service'
import { delay } from '@/lib/async'
import type {
  CreateTaskInput,
  MoveTaskInput,
  Task,
  UpdateTaskInput,
} from '@/types/task'

/** Simulated network latency so loading states are real. */
const LATENCY_MS = 250

/**
 * Task service - the ONLY way UI code reads or writes tasks.
 * Hooks call these through TanStack Query; components never touch
 * localStorage or mock-data.json directly.
 */
export const taskService = {
  async getTasks(): Promise<Task[]> {
    await delay(LATENCY_MS)
    return taskRepository.getAll()
  },

  async getTask(id: number): Promise<Task> {
    await delay(LATENCY_MS)
    const task = taskRepository.getById(id)
    if (!task) throw new ApiError(`Task ${id} not found`, 404)
    return task
  },

  async createTask(input: CreateTaskInput): Promise<Task> {
    await delay(LATENCY_MS)
    return taskRepository.create(input)
  },

  async updateTask(id: number, patch: UpdateTaskInput): Promise<Task> {
    await delay(LATENCY_MS)
    const updated = taskRepository.update(id, patch)
    if (!updated) throw new ApiError(`Task ${id} not found`, 404)
    return updated
  },

  /**
   * Moves a task to a status column at a 1-based position, recalculating order
   * values for both affected columns and maintaining completedAt semantics.
   */
  async moveTask(input: MoveTaskInput): Promise<Task> {
    await delay(LATENCY_MS)
    const moved = taskRepository.move(input)
    if (!moved) throw new ApiError(`Task ${input.taskId} not found`, 404)
    return moved
  },

  /** Deletes a task and cascades deletion of its comments. */
  async deleteTask(id: number): Promise<void> {
    await delay(LATENCY_MS)
    const deleted = taskRepository.delete(id)
    if (!deleted) throw new ApiError(`Task ${id} not found`, 404)
    deleteCommentsForTask(id)
  },
}
