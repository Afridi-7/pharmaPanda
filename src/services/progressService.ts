import type { Achievement, Competency } from '@/types'
import { http } from './http'

/**
 * Progress snapshot.
 *
 * Competency aggregation and achievement rules run server-side against the
 * user's stored evaluations, so this is one request rather than one per report.
 */
export interface ProgressSnapshot {
  overallScore: number
  competencies: Competency[]
  achievements: Achievement[]
  weeklyActivity: { label: string; consultations: number }[]
  streakDays: number
  consultationsCompleted: number
  recommendedScenarioSlug: string
  recommendationReason: string
}

export const progressService = {
  async snapshot(): Promise<ProgressSnapshot> {
    return http<ProgressSnapshot>('/progress')
  },

  async competencies(): Promise<Competency[]> {
    return http<Competency[]>('/progress/competencies')
  },

  async achievements(): Promise<Achievement[]> {
    return http<Achievement[]>('/progress/achievements')
  },
}
