import type { AttemptSummary, Evaluation } from '@/types'
import { http } from './http'

/**
 * Consultation reports, served by the API.
 *
 * Scoring runs server-side in the Python evaluation engine, and each report is
 * persisted when it is first produced — so a historical report never silently
 * changes if the scoring rules are later revised.
 */
export const evaluationService = {
  /** Stage names for the review animation. Filled from the API on first use. */
  stages: [
    'History taking',
    'Clinical reasoning',
    'Medication safety',
    'Communication',
    'Counseling',
    'Referral decision',
  ] as string[],

  async evaluate(attemptId: string): Promise<Evaluation> {
    return http<Evaluation>(`/attempts/${encodeURIComponent(attemptId)}/evaluate`, { method: 'POST' })
  },

  async getByAttempt(attemptId: string): Promise<Evaluation> {
    return http<Evaluation>(`/attempts/${encodeURIComponent(attemptId)}/evaluation`)
  },

  async history(): Promise<AttemptSummary[]> {
    return http<AttemptSummary[]>('/attempts')
  },
}
