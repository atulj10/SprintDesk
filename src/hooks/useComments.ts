import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { commentService } from '@/services/comment.service'
import type { AddCommentInput } from '@/types/task'

export function useComments(taskId: number | null) {
  return useQuery({
    queryKey: taskId === null ? ['comments', 'none'] : queryKeys.comments(taskId),
    queryFn: () => commentService.getComments(taskId ?? undefined),
    enabled: taskId !== null,
  })
}

export function useAddComment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: AddCommentInput) => commentService.addComment(input),
    onSuccess: (_data, input) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.comments(input.taskId) })
    },
  })
}
