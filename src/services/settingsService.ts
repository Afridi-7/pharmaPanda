import { request } from './api'
import { getDb, mutate, type MockDatabase } from './store'

export type AppSettings = MockDatabase['settings']

export const settingsService = {
  async get(): Promise<AppSettings> {
    return request(() => getDb().settings, { latency: 180, label: 'settingsService.get' })
  },

  async update(patch: Partial<AppSettings>): Promise<AppSettings> {
    return request(
      () => {
        const db = mutate((draft) => {
          draft.settings = { ...draft.settings, ...patch }
        })
        return db.settings
      },
      { latency: 220, label: 'settingsService.update' },
    )
  },
}
