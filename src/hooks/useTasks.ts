import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { taskService } from '@/services/task.service'
import type { CreateTaskInput, MoveTaskInput, UpdateTaskInput } from '@/types/task'

/** All tasks - the single source the board, dashboard and analytics read. */
export function useTasks() {
  return useQuery({
    queryKey: queryKeys.tasks,
    queryFn: () => taskService.getTasks(),
  })
}

export function useCreateTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateTaskInput) => taskService.createTask(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.tasks })
    },
  })
}

export function useUpdateTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, patch }: { id: number; patch: UpdateTaskInput }) =>
      taskService.updateTask(id, patch),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.tasks })
    },
  })
}

export function useMoveTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: MoveTaskInput) => taskService.moveTask(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.tasks })
    },
  })
}

export function useDeleteTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => taskService.deleteTask(id),
    onSuccess: (_data, deletedId) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.tasks })
      void queryClient.invalidateQueries({ queryKey: ['comments'] })
      void queryClient.removeQueries({ queryKey: queryKeys.comments(deletedId) })
    },
  })
}
