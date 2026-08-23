import { beforeEach, describe, expect, it } from 'vitest'
import {
  rehydrateTaskRepositoryForTests,
  resetTaskRepositoryForTests,
  taskRepository,
} from '@/services/task.repository'
import type { CreateTaskInput } from '@/types/task'

/**
 * Board-state behaviour tests. Task CRUD/ordering lives in the persistent
 * task repository (single source of truth for the board), so these cover the
 * required add / move / delete / reorder flows.
 */

function makeInput(overrides: Partial<CreateTaskInput> = {}): CreateTaskInput {
  return {
    title: 'Test task',
    description: 'Created by a test',
    status: 'backlog',
    priority: 'medium',
    assigneeId: 1,
    dueDate: '2026-09-01',
    sprintId: 3,
    ...overrides,
  }
}

beforeEach(() => {
  resetTaskRepositoryForTests()
})

describe('taskRepository (board state)', () => {
  it('seeds the board from mock data with stable per-column order', () => {
    const tasks = taskRepository.getAll()
    expect(tasks).toHaveLength(30)

    // The shipped mock data numbers `order` per sprint (values repeat within a
    // column); hydration must normalise each column to unique gapless ranks.
    const done = tasks.filter((task) => task.status === 'done').sort((a, b) => a.order - b.order)
    expect(done).toHaveLength(18)
    expect(done.map((task) => task.order)).toEqual(Array.from({ length: 18 }, (_, i) => i + 1))
    expect(new Set(done.map((task) => task.id)).size).toBe(18)

    for (const status of ['backlog', 'in-progress', 'review'] as const) {
      const column = tasks
        .filter((task) => task.status === status)
        .sort((a, b) => a.order - b.order)
        .map((task) => task.order)
      expect(column).toEqual(Array.from({ length: column.length }, (_, i) => i + 1))
    }
  })

  it('adds a task at the end of its column', () => {
    const created = taskRepository.create(makeInput({ title: 'Brand new task' }))

    expect(created.id).toBe(31)
    expect(created.status).toBe('backlog')

    const backlog = taskRepository
      .getAll()
      .filter((task) => task.status === 'backlog')
      .sort((a, b) => a.order - b.order)
    expect(backlog[backlog.length - 1].id).toBe(created.id)
    expect(backlog.map((task) => task.order)).toEqual([1, 2, 3, 4])
  })

  it('persists created tasks across a reload (simulated app restart)', () => {
    const created = taskRepository.create(makeInput({ title: 'Persistent task' }))

    // Fresh module state reads from localStorage - like a page refresh.
    rehydrateTaskRepositoryForTests()
    const restored = taskRepository.getById(created.id)

    expect(restored?.title).toBe('Persistent task')
  })

  it('moves a task between columns and recalculates both orders', () => {
    // Task 2 is in-progress at order 1; move it to review at position 2.
    const moved = taskRepository.move({ taskId: 2, status: 'review', order: 2 })

    expect(moved?.status).toBe('review')
    expect(moved?.order).toBe(2)

    const inProgress = taskRepository
      .getAll()
      .filter((task) => task.status === 'in-progress')
      .sort((a, b) => a.order - b.order)
    expect(inProgress.map((task) => task.order)).toEqual([1, 2, 3, 4])

    const review = taskRepository
      .getAll()
      .filter((task) => task.status === 'review')
      .sort((a, b) => a.order - b.order)
    expect(review.map((task) => task.id)).toEqual([3, 2, 8, 12, 17])
    expect(review.map((task) => task.order)).toEqual([1, 2, 3, 4, 5])
  })

  it('reorders within the same column (drag to top)', () => {
    const before = taskRepository
      .getAll()
      .filter((task) => task.status === 'done')
      .sort((a, b) => a.order - b.order)
    const lastId = before[before.length - 1].id

    const moved = taskRepository.move({ taskId: lastId, status: 'done', order: 1 })
    expect(moved?.order).toBe(1)

    const after = taskRepository
      .getAll()
      .filter((task) => task.status === 'done')
      .sort((a, b) => a.order - b.order)
    expect(after[0].id).toBe(lastId)
    expect(after.map((task) => task.order)).toEqual(Array.from({ length: 18 }, (_, i) => i + 1))
  })

  it('maintains completedAt when moving into and out of done', () => {
    const movedToDone = taskRepository.move({ taskId: 4, status: 'done', order: 19 })
    expect(movedToDone?.completedAt).not.toBeNull()

    const movedBack = taskRepository.move({ taskId: 4, status: 'backlog', order: 1 })
    expect(movedBack?.completedAt).toBeNull()
  })

  it('stamps and clears completedAt through update() status changes', () => {
    // update() with a status change must stamp PERSISTED state, not just the
    // return value (regression: bookkeeping once hit an orphaned object copy).
    const promoted = taskRepository.update(4, { status: 'done' })
    expect(promoted?.status).toBe('done')
    expect(promoted?.completedAt).not.toBeNull()
    expect(taskRepository.getById(4)?.completedAt).not.toBeNull()

    const demoted = taskRepository.update(4, { status: 'in-progress' })
    expect(demoted?.completedAt).toBeNull()
    expect(taskRepository.getById(4)?.completedAt).toBeNull()
  })

  it('keeps both columns gapless after an update() status change', () => {
    taskRepository.update(4, { status: 'done' })

    // Backlog lost its first card - remaining orders must close the gap.
    const backlog = taskRepository
      .getAll()
      .filter((task) => task.status === 'backlog')
      .sort((a, b) => a.order - b.order)
    expect(backlog.map((task) => task.id)).toEqual([7, 11])
    expect(backlog.map((task) => task.order)).toEqual([1, 2])

    const done = taskRepository
      .getAll()
      .filter((task) => task.status === 'done')
      .sort((a, b) => a.order - b.order)
    expect(done).toHaveLength(19)
    expect(done[18].id).toBe(4)
    expect(done.map((task) => task.order)).toEqual(Array.from({ length: 19 }, (_, i) => i + 1))
  })

  it('updates editable fields without changing position', () => {
    const updated = taskRepository.update(2, { title: 'Build Kanban board v2' })

    expect(updated?.title).toBe('Build Kanban board v2')
    expect(updated?.status).toBe('in-progress')
    expect(updated?.order).toBe(1)
    expect(new Date(updated?.updatedAt ?? '').getTime()).toBeGreaterThanOrEqual(
      new Date(updated?.createdAt ?? '').getTime(),
    )
  })

  it('deletes a task and closes the gap in column ordering', () => {
    expect(taskRepository.delete(2)).toBe(true)
    expect(taskRepository.getById(2)).toBeUndefined()

    const inProgress = taskRepository
      .getAll()
      .filter((task) => task.status === 'in-progress')
      .sort((a, b) => a.order - b.order)
    expect(inProgress.map((task) => task.id)).toEqual([6, 10, 16, 18])
    expect(inProgress.map((task) => task.order)).toEqual([1, 2, 3, 4])

    // Deleting again is a no-op returning false.
    expect(taskRepository.delete(2)).toBe(false)
  })
})
