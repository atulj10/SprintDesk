import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { sprintService } from '@/services/sprint.service'

export function useSprints() {
  return useQuery({
    queryKey: queryKeys.sprints,
    queryFn: () => sprintService.getSprints(),
    staleTime: Number.POSITIVE_INFINITY,
  })
}
