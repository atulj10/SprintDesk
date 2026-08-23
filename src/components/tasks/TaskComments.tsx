import { useState } from 'react'
import { Send } from 'lucide-react'
import { useAddComment, useComments } from '@/hooks/useComments'
import { useUsers } from '@/hooks/useUsers'
import { useAuthStore } from '@/stores/auth.store'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Skeleton, SkeletonText } from '@/components/ui/Skeleton'
import { formatDateTime } from '@/lib/date'

export interface TaskCommentsProps {
  taskId: number
}

/**
 * Comment thread for a task. Authors are resolved through comment.authorId →
 * users.id; the signed-in user (not part of the mock team) is shown from the
 * auth session instead of being duplicated into user data.
 */
export function TaskComments({ taskId }: TaskCommentsProps) {
  const commentsQuery = useComments(taskId)
  const addComment = useAddComment()
  const { data: users = [] } = useUsers()
  const sessionUser = useAuthStore((state) => state.user)

  const [message, setMessage] = useState('')

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmed = message.trim()
    if (!trimmed) return

    addComment.mutate(
      {
        taskId,
        authorId: sessionUser?.id ?? 0,
        message: trimmed,
      },
      {
        onSuccess: () => setMessage(''),
      },
    )
  }

  const resolveAuthor = (authorId: number): { name: string; avatar?: string } => {
    if (sessionUser && authorId === sessionUser.id) {
      return { name: `${sessionUser.firstName} ${sessionUser.lastName}`.trim() || sessionUser.username }
    }
    const author = users.find((user) => user.id === authorId)
    return author ? { name: author.name, avatar: author.avatar } : { name: 'Unknown user' }
  }

  const comments = commentsQuery.data ?? []

  return (
    <section aria-label={`Comments for task ${taskId}`} className="space-y-3">
      <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
        Comments{' '}
        <span className="font-normal text-gray-400 dark:text-gray-500">
          ({comments.length})
        </span>
      </h4>

      {commentsQuery.isLoading ? (
        <div className="space-y-2" aria-hidden="true">
          <SkeletonText lines={2} />
          <SkeletonText lines={1} />
          <Skeleton className="h-5 w-full" />
        </div>
      ) : comments.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-300 p-3 text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
          No comments yet. Start the discussion below.
        </p>
      ) : (
        <ul className="space-y-3" role="list">
          {comments.map((comment) => {
            const author = resolveAuthor(comment.authorId)
            return (
              <li key={comment.id} className="flex gap-2.5">
                <Avatar name={author.name} src={author.avatar} size="sm" />
                <div className="min-w-0 flex-1 rounded-lg bg-gray-100 px-3 py-2 dark:bg-gray-800">
                  <div className="flex flex-wrap items-center justify-between gap-x-2">
                    <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                      {author.name}
                    </span>
                    <time
                      className="text-[11px] text-gray-400 dark:text-gray-500"
                      dateTime={comment.createdAt}
                    >
                      {formatDateTime(comment.createdAt)}
                    </time>
                  </div>
                  <p className="mt-1 whitespace-pre-line text-sm text-gray-700 dark:text-gray-300">
                    {comment.message}
                  </p>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <form onSubmit={handleSubmit} noValidate className="flex items-end gap-2 pt-1">
        <div className="flex-1">
          <label htmlFor={`comment-input-${taskId}`} className="sr-only">
            Add a comment
          </label>
          <textarea
            id={`comment-input-${taskId}`}
            rows={2}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Write a comment…"
            className="block w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500"
          />
        </div>
        <Button
          type="submit"
          size="icon"
          isLoading={addComment.isPending}
          disabled={!message.trim() && !addComment.isPending}
          aria-label="Post comment"
        >
          {!addComment.isPending ? <Send className="h-4 w-4" aria-hidden="true" /> : null}
        </Button>
      </form>
    </section>
  )
}
