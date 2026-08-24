import type { Achievement, Competency, CompetencyKey } from '@/types'
import { notFound, request } from './api'
import { getDb } from './store'

export const competencyService = {
  async list(): Promise<Competency[]> {
    return request(() => getDb().competencies, { latency: 280, label: 'competencyService.list' })
  },

  async get(key: CompetencyKey): Promise<Competency> {
    return request(() => getDb().competencies.find((c) => c.key === key) ?? notFound('competency'), {
      latency: 240,
      label: 'competencyService.get',
    })
  },

  async overall(): Promise<number> {
    return request(
      () => {
        const items = getDb().competencies
        return Math.round(items.reduce((sum, c) => sum + c.score, 0) / Math.max(1, items.length))
      },
      { latency: 160, label: 'competencyService.overall' },
    )
  },

  async achievements(): Promise<Achievement[]> {
    return request(() => getDb().achievements, { latency: 260, label: 'competencyService.achievements' })
  },
}
