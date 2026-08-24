import type { Difficulty, Patient, Scenario, ScenarioCategory } from '@/types'
import { getPatient, patients } from '@/data/patients'
import { notFound, request } from './api'
import { getDb } from './store'

export interface ScenarioFilters {
  search?: string
  categories?: ScenarioCategory[]
  difficulties?: Difficulty[]
  /** Maximum estimated duration in minutes. */
  maxDuration?: number
  status?: 'all' | 'completed' | 'not-started' | 'in-progress'
}

export const scenarioService = {
  async list(filters: ScenarioFilters = {}): Promise<Scenario[]> {
    return request(
      () => {
        const { search = '', categories = [], difficulties = [], maxDuration, status = 'all' } = filters
        const needle = search.trim().toLowerCase()
        return getDb().scenarios.filter((scenario) => {
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
      { latency: 300, label: 'scenarioService.list' },
    )
  },

  async get(id: string): Promise<Scenario> {
    return request(
      () => getDb().scenarios.find((s) => s.id === id) ?? notFound('simulation'),
      { latency: 260, label: 'scenarioService.get' },
    )
  },

  /** Patient profile *including* hidden facts — the UI only renders what has been discovered. */
  async getPatient(patientId: string): Promise<Patient> {
    return request(() => getPatient(patientId) ?? notFound('patient'), {
      latency: 220,
      label: 'scenarioService.getPatient',
    })
  },

  async featured(): Promise<{ continueScenario: Scenario; recommended: Scenario }> {
    return request(
      () => {
        const all = getDb().scenarios
        const continueScenario =
          all.find((s) => s.status === 'in-progress') ?? all.find((s) => s.status === 'not-started') ?? all[0]
        const recommended = all.find((s) => s.id === 'sc_inhaler') ?? all[1]
        return { continueScenario, recommended }
      },
      { latency: 200, label: 'scenarioService.featured' },
    )
  },

  categories(): ScenarioCategory[] {
    return [...new Set(getDb().scenarios.map((s) => s.category))]
  },

  allPatients(): Patient[] {
    return patients
  },
}
