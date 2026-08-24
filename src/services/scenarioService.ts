import type { Difficulty, Patient, Scenario, ScenarioCategory } from '@/types'
import { http } from './http'

export interface ScenarioFilters {
  search?: string
  categories?: ScenarioCategory[]
  difficulties?: Difficulty[]
  /** Maximum estimated duration in minutes. */
  maxDuration?: number
  status?: 'all' | 'completed' | 'not-started' | 'in-progress'
}

/**
 * Scenario catalogue, served by the API.
 *
 * `status`, `previousScore` and `lastAttemptId` are resolved per-user from the
 * caller's own attempts, so progress follows the account rather than the
 * browser. Filtering stays client-side: the catalogue is ten rows, and the
 * simulation library already filters what it holds in memory.
 */
export const scenarioService = {
  async list(filters: ScenarioFilters = {}): Promise<Scenario[]> {
    const scenarios = await http<Scenario[]>('/scenarios')
    const { search = '', categories = [], difficulties = [], maxDuration, status = 'all' } = filters
    const needle = search.trim().toLowerCase()

    return scenarios.filter((scenario) => {
      if (needle) {
        const haystack = [
          scenario.title,
          scenario.tagline,
          scenario.description,
          scenario.category,
          ...scenario.skills,
        ]
          .join(' ')
          .toLowerCase()
        if (!haystack.includes(needle)) return false
      }
      if (categories.length > 0 && !categories.includes(scenario.category)) return false
      if (difficulties.length > 0 && !difficulties.includes(scenario.difficulty)) return false
      if (maxDuration && scenario.durationMinutes[1] > maxDuration) return false
      if (status !== 'all' && scenario.status !== status) return false
      return true
    })
  },

  async get(id: string): Promise<Scenario> {
    return http<Scenario>(`/scenarios/${encodeURIComponent(id)}`)
  },

  /**
   * The patient as far as this attempt has uncovered them.
   *
   * Undiscovered facts are filtered out server-side and never reach the
   * browser, so the discovery mechanic cannot be bypassed by reading the
   * network response.
   */
  async getPatientForAttempt(attemptId: string): Promise<Patient> {
    return http<Patient>(`/attempts/${encodeURIComponent(attemptId)}/patient`)
  },

  async featured(): Promise<{ continueScenario: Scenario; recommended: Scenario }> {
    const all = await this.list()
    const continueScenario =
      all.find((s) => s.status === 'in-progress') ?? all.find((s) => s.status === 'not-started') ?? all[0]
    const recommended = all.find((s) => s.id === 'sc_inhaler') ?? all[1]
    return { continueScenario, recommended }
  },
}
