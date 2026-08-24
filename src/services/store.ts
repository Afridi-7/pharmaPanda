import type {
  Achievement,
  AttemptSummary,
  Competency,
  Evaluation,
  Scenario,
  ScenarioAttempt,
  User,
} from '@/types'
import { achievements as achievementSeed } from '@/data/achievements'
import { attemptHistory } from '@/data/attempts'
import { competencySeed } from '@/data/users'
import { scenarios as scenarioSeed } from '@/data/scenarios'

/**
 * Local store for consultation progress, mirrored into localStorage so a
 * session survives a page refresh. Everything here starts empty and is only
 * written by real activity. Nothing outside `src/services` touches it.
 *
 * Version note: v1 shipped with seeded demo progress (completed scenarios,
 * competency scores, unlocked achievements). Bumping the key to v2 discards
 * those stale values in browsers that already stored them, so an existing
 * session does not keep showing progress that was never earned.
 */

const STORAGE_KEY = 'pharmapanda.store.v2'

export interface MockDatabase {
  /**
   * @deprecated NOT the auth source of truth. Authentication is backend-backed
   * (PostgreSQL + JWT) via `authService`; these two fields survive only because
   * the scenario/attempt mocks read `user` for a userId. Remove when those
   * services migrate to the API.
   */
  user: User | null
  /** @deprecated See `user` above — no longer consulted for authentication. */
  authenticated: boolean
  scenarios: Scenario[]
  attempts: Record<string, ScenarioAttempt>
  evaluations: Record<string, Evaluation>
  history: AttemptSummary[]
  competencies: Competency[]
  achievements: Achievement[]
  settings: {
    emailDigest: boolean
    practiceReminders: boolean
    soundEffects: boolean
    reducedMotion: boolean
    caseDifficulty: 'Adaptive' | 'Beginner' | 'Intermediate' | 'Advanced'
    feedbackDepth: 'Concise' | 'Detailed'
    showHints: boolean
  }
}

function seed(): MockDatabase {
  return {
    user: null,
    authenticated: false,
    scenarios: scenarioSeed.map((s) => ({ ...s })),
    attempts: {},
    evaluations: {},
    history: attemptHistory.map((h) => ({ ...h })),
    competencies: competencySeed.map((c) => ({ ...c, history: [...c.history] })),
    achievements: achievementSeed.map((a) => ({ ...a })),
    settings: {
      emailDigest: true,
      practiceReminders: true,
      soundEffects: false,
      reducedMotion: false,
      caseDifficulty: 'Adaptive',
      feedbackDepth: 'Detailed',
      showHints: true,
    },
  }
}

let db: MockDatabase = load()

function load(): MockDatabase {
  if (typeof window === 'undefined') return seed()
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return seed()
    const parsed = JSON.parse(raw) as MockDatabase
    // Merge over a fresh seed so newly added mock content appears for returning users.
    return { ...seed(), ...parsed, settings: { ...seed().settings, ...parsed.settings } }
  } catch {
    return seed()
  }
}

function persist() {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(db))
  } catch {
    // Storage full or unavailable — the session still works in memory.
  }
}

export function getDb() {
  return db
}

export function mutate(fn: (draft: MockDatabase) => void) {
  fn(db)
  persist()
  return db
}

export function resetDb() {
  db = seed()
  persist()
}

/**
 * Development demo account.
 *
 * This is a REAL PostgreSQL row, created by `backend/scripts/seed_demo_user.py`
 * using the same hashing path as normal registration — not a fake client-side
 * user. Development-only credentials; run the seed script if login fails.
 */
export const demoCredentials = { email: 'demo@pharmapanda.app', password: 'pharmapanda-dev' }

