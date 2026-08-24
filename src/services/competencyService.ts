import type { Achievement, Competency, CompetencyKey } from '@/types'
import { ApiError } from './api'
import { progressService } from './progressService'

/** Competency and achievement progress, served by `/api/progress`. */
export const competencyService = {
  async list(): Promise<Competency[]> {
    return progressService.competencies()
  },

  async get(key: CompetencyKey): Promise<Competency> {
    const found = (await this.list()).find((c) => c.key === key)
    if (!found) throw new ApiError('competency not found', 404, 'We couldn’t find that competency.')
    return found
  },

  async overall(): Promise<number> {
    return (await progressService.snapshot()).overallScore
  },

  async achievements(): Promise<Achievement[]> {
    return progressService.achievements()
  },
}
