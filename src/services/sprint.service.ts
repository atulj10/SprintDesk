import { ApiError } from '@/services/api/apiClient'
import { MOCK_DATA } from '@/data/dataSource'
import { delay } from '@/lib/async'
import type { Sprint } from '@/types/sprint'

const LATENCY_MS = 150

/** Sprint service - read-only sprint metadata backed by mock-data.json. */
export const sprintService = {
  async getSprints(): Promise<Sprint[]> {
    await delay(LATENCY_MS)
    return structuredClone(MOCK_DATA.sprints)
  },

  async getSprint(id: number): Promise<Sprint> {
    await delay(LATENCY_MS)
    const sprint = MOCK_DATA.sprints.find((candidate) => candidate.id === id)
    if (!sprint) throw new ApiError(`Sprint ${id} not found`, 404)
    return structuredClone(sprint)
  },

  /**
   * The "current" sprint is the one whose date range contains today;
   * falls back to the latest sprint that has started.
   */
  getCurrentSprint(sprints: Sprint[]): Sprint | null {
    const today = new Date().toISOString().slice(0, 10)
    const active = sprints.find((s) => s.startDate <= today && today <= s.endDate)
    if (active) return active
    const started = sprints.filter((s) => s.startDate <= today)
    return started.length > 0 ? started[started.length - 1] : null
  },
}
