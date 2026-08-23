import { ApiError } from '@/services/api/apiClient'
import { MOCK_DATA } from '@/data/dataSource'
import { delay } from '@/lib/async'
import type { User } from '@/types/user'

const LATENCY_MS = 150

/** User service - read-only team member data backed by mock-data.json. */
export const userService = {
  async getUsers(): Promise<User[]> {
    await delay(LATENCY_MS)
    return structuredClone(MOCK_DATA.users)
  },

  async getUser(id: number): Promise<User> {
    await delay(LATENCY_MS)
    const user = MOCK_DATA.users.find((candidate) => candidate.id === id)
    if (!user) throw new ApiError(`User ${id} not found`, 404)
    return structuredClone(user)
  },
}

/** Synchronous lookup used by components that already have the users list. */
export function findUser(users: User[], id: number): User | undefined {
  return users.find((user) => user.id === id)
}
