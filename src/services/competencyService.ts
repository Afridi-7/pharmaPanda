import type { Achievement, Competency, CompetencyKey } from '@/types'
import { achievements as achievementDefinitions } from '@/data/achievements'
import { ApiError } from './api'
import { dashboardService } from './dashboardService'

/**
 * Competency and achievement progress.
 *
 * Derived from the caller's own consultation reports via `dashboardService`.
 * A dedicated `/api/progress` endpoint is the natural next step; the call
 * surface here will not change when it lands.
 */
export const competencyService = {
  async list(): Promise<Competency[]> {
    return (await dashboardService.snapshot()).competencies
  },

  async get(key: CompetencyKey): Promise<Competency> {
    const found = (await this.list()).find((c) => c.key === key)
    if (!found) throw new ApiError('competency not found', 404, 'We couldn’t find that competency.')
    return found
  },

  async overall(): Promise<number> {
    return (await dashboardService.snapshot()).overallScore
  },

  /** Definitions only until achievement state is tracked server-side. */
  async achievements(): Promise<Achievement[]> {
    return achievementDefinitions
  },
}
