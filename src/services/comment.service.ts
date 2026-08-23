import { ApiError } from '@/services/api/apiClient'
import { commentRepository } from '@/services/comment.repository'
import { taskRepository } from '@/services/task.repository'
import { delay } from '@/lib/async'
import type { AddCommentInput, Comment } from '@/types/task'

const LATENCY_MS = 250

/** Comment service - all comment reads/writes for the UI. */
export const commentService = {
  async getComments(taskId?: number): Promise<Comment[]> {
    await delay(LATENCY_MS)
    return taskId === undefined
      ? commentRepository.getAll()
      : commentRepository.getByTask(taskId)
  },

  /** Validates that the target task exists before attaching a comment. */
  async addComment(input: AddCommentInput): Promise<Comment> {
    await delay(LATENCY_MS)
    if (!taskRepository.getById(input.taskId)) {
      throw new ApiError(`Task ${input.taskId} not found`, 404)
    }
    return commentRepository.add(input)
  },
}

/** Internal helper used by task deletion cascade; not a public UI API. */
export function deleteCommentsForTask(taskId: number): void {
  commentRepository.deleteForTask(taskId)
}
