import { FilterX } from 'lucide-react'
import { TASK_PRIORITIES, PRIORITY_LABELS } from '@/types/task'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import type { AssigneeFilter, BoardFilters as Filters, PriorityFilter } from '@/stores/board.store'
import type { User } from '@/types/user'

export interface BoardFiltersProps {
  filters: Filters
  users: User[]
  onPriorityChange: (priority: PriorityFilter) => void
  onAssigneeChange: (assigneeId: AssigneeFilter) => void
  onClear: () => void
}

/** Optional board filters (bonus): priority + assignee. */
export function BoardFilters({
  filters,
  users,
  onPriorityChange,
  onAssigneeChange,
  onClear,
}: BoardFiltersProps) {
  const hasActiveFilters = filters.priority !== 'all' || filters.assigneeId !== 'all'

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="w-40">
        <Select
          label="Filter by priority"
          value={filters.priority}
          onChange={(event) => onPriorityChange(event.target.value as PriorityFilter)}
        >
          <option value="all">All priorities</option>
          {TASK_PRIORITIES.map((priority) => (
            <option key={priority} value={priority}>
              {PRIORITY_LABELS[priority]}
            </option>
          ))}
        </Select>
      </div>

      <div className="w-48">
        <Select
          label="Filter by assignee"
          value={filters.assigneeId === 'all' ? 'all' : String(filters.assigneeId)}
          onChange={(event) =>
            onAssigneeChange(event.target.value === 'all' ? 'all' : Number(event.target.value))
          }
        >
          <option value="all">All assignees</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name}
            </option>
          ))}
        </Select>
      </div>

      {hasActiveFilters ? (
        <Button variant="ghost" size="md" onClick={onClear} className="mb-0.5">
          <FilterX className="h-4 w-4" aria-hidden="true" />
          Clear filters
        </Button>
      ) : null}
    </div>
  )
}
