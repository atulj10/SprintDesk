import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { userService } from '@/services/user.service'

export function useUsers() {
  return useQuery({
    queryKey: queryKeys.users,
    queryFn: () => userService.getUsers(),
    staleTime: Number.POSITIVE_INFINITY,
  })
}
