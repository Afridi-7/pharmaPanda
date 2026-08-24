/**
 * Practice preferences.
 *
 * Genuinely local: these are per-device UI choices, not account data, so they
 * live in localStorage rather than the API. If they ever need to follow the
 * account across devices, they move to a `/api/settings` endpoint and this
 * call surface stays the same.
 */

export interface AppSettings {
  emailDigest: boolean
  practiceReminders: boolean
  soundEffects: boolean
  reducedMotion: boolean
  caseDifficulty: 'Adaptive' | 'Beginner' | 'Intermediate' | 'Advanced'
  feedbackDepth: 'Concise' | 'Detailed'
  showHints: boolean
}

const STORAGE_KEY = 'pharmapanda.settings.v1'

const DEFAULTS: AppSettings = {
  emailDigest: true,
  practiceReminders: true,
  soundEffects: false,
  reducedMotion: false,
  caseDifficulty: 'Adaptive',
  feedbackDepth: 'Detailed',
  showHints: true,
}

function read(): AppSettings {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULTS }
    // Merge over defaults so a newly added setting is present for existing users.
    return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<AppSettings>) }
  } catch {
    return { ...DEFAULTS }
  }
}

function write(settings: AppSettings): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {
    // Storage unavailable — the choice still applies for this session.
  }
}

export const settingsService = {
  async get(): Promise<AppSettings> {
    return read()
  },

  async update(patch: Partial<AppSettings>): Promise<AppSettings> {
    const next = { ...read(), ...patch }
    write(next)
    return next
  },
}
