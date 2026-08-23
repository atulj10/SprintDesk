import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { useBoardStore } from '@/stores/board.store'
import { useDeleteTask } from '@/hooks/useTasks'
import { useToast } from '@/hooks/useToast'

/**
 * Confirmation dialog guarding task deletion. Wired to the board store's
 * `taskPendingDeletion` so any surface (card menu, drawer) can trigger it.
 */
export function DeleteTaskDialog() {
  const pending = useBoardStore((state) => state.taskPendingDeletion)
  const cancelDelete = useBoardStore((state) => state.cancelDeleteTask)
  const closeDrawer = useBoardStore((state) => state.closeTaskDrawer)

  const deleteTask = useDeleteTask()
  const toast = useToast()

  const handleConfirm = () => {
    if (!pending) return
    deleteTask.mutate(pending.id, {
      onSuccess: () => {
        toast.success('Task deleted')
        cancelDelete()
        closeDrawer()
      },
      onError: () => toast.error('Could not delete the task'),
    })
  }

  return (
    <Modal
      open={pending !== null}
      onClose={() => {
        if (!deleteTask.isPending) cancelDelete()
      }}
      title="Delete task"
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={cancelDelete} disabled={deleteTask.isPending}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => void handleConfirm()}
            isLoading={deleteTask.isPending}
            loadingText="Deleting…"
          >
            Delete
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/60">
          <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" aria-hidden="true" />
        </span>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Are you sure you want to delete{' '}
          <span className="font-semibold text-gray-900 dark:text-gray-100">
            “{pending?.title ?? 'this task'}”
          </span>
          ? This will also remove its comments and cannot be undone.
        </p>
      </div>
    </Modal>
  )
}
