import mockData from '@/data/mock-data.json'
import type { AppNotification } from '@/types/notification'
import type { User } from '@/types/user'
import type { Sprint } from '@/types/sprint'
import type { AddCommentInput, Comment, Task } from '@/types/task'
import { readStorage, writeStorage } from '@/lib/storage'
import { nowIso } from '@/data/dataSource'

interface MockDataFile {
  users: User[]
  sprints: Sprint[]
  tasks: Task[]
  comments: Comment[]
  notifications: AppNotification[]
}

const COMMENTS_STORAGE_KEY = 'sprintdesk.comments.v1'

function seedComments(): Comment[] {
  return structuredClone((mockData as unknown as MockDataFile).comments)
}

let commentsState: Comment[] = hydrate()

function hydrate(): Comment[] {
  const stored = readStorage<Comment[]>(COMMENTS_STORAGE_KEY)
  return Array.isArray(stored) ? stored : seedComments()
}

function commit(): void {
  writeStorage(COMMENTS_STORAGE_KEY, commentsState)
}

export const commentRepository = {
  getAll(): Comment[] {
    return structuredClone(commentsState)
  },

  getByTask(taskId: number): Comment[] {
    return structuredClone(
      commentsState
        .filter((comment) => comment.taskId === taskId)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    )
  },

  add(input: AddCommentInput): Comment {
    const comment: Comment = {
      id: commentsState.reduce((max, item) => Math.max(max, item.id), 0) + 1,
      taskId: input.taskId,
      authorId: input.authorId,
      message: input.message,
      createdAt: nowIso(),
    }
    commentsState.push(comment)
    commit()
    return structuredClone(comment)
  },

  deleteForTask(taskId: number): void {
    if (!commentsState.some((comment) => comment.taskId === taskId)) return
    commentsState = commentsState.filter((comment) => comment.taskId !== taskId)
    commit()
  },
}
