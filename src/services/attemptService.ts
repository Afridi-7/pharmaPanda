import type {
  ConversationMessage,
  PatientFact,
  RecommendationOption,
  ReferralOption,
  ScenarioAttempt,
} from '@/types'
import { http } from './http'

export interface AskResult {
  attempt: ScenarioAttempt
  messages: ConversationMessage[]
  revealed: PatientFact[]
}

/**
 * Consultation lifecycle, served by the API.
 *
 * The patient engine now runs server-side, so what the simulated patient says
 * and which facts a question unlocks are decided in PostgreSQL-backed Python
 * rather than in the browser. Method signatures are unchanged from the local
 * implementation, so the Simulation Player did not need rewriting.
 */
export const attemptService = {
  async start(scenarioId: string): Promise<ScenarioAttempt> {
    return http<ScenarioAttempt>('/attempts', { method: 'POST', body: { scenarioId } })
  },

  async get(id: string): Promise<ScenarioAttempt> {
    return http<ScenarioAttempt>(`/attempts/${encodeURIComponent(id)}`)
  },

  async ask(id: string, question: string): Promise<AskResult> {
    return http<AskResult>(`/attempts/${encodeURIComponent(id)}/messages`, {
      method: 'POST',
      body: { question: question.trim() },
    })
  },

  async saveNotes(id: string, notes: string): Promise<ScenarioAttempt> {
    return http<ScenarioAttempt>(`/attempts/${encodeURIComponent(id)}/notes`, {
      method: 'PATCH',
      body: { notes },
    })
  },

  /**
   * Persist elapsed time.
   *
   * Called on a long interval and on unmount, never every second — the player
   * owns the running clock and only checkpoints it here.
   */
  async tick(id: string, seconds: number): Promise<void> {
    try {
      await http<ScenarioAttempt>(`/attempts/${encodeURIComponent(id)}/duration`, {
        method: 'PATCH',
        body: { durationSeconds: seconds },
      })
    } catch {
      // A dropped checkpoint costs a few seconds of recorded duration; it must
      // never interrupt the consultation.
    }
  },

  async recommend(id: string, choice: RecommendationOption, reasoning: string): Promise<AskResult> {
    return http<AskResult>(`/attempts/${encodeURIComponent(id)}/recommendation`, {
      method: 'POST',
      body: { choice, reasoning },
    })
  },

  async counsel(id: string, script: string): Promise<AskResult> {
    return http<AskResult>(`/attempts/${encodeURIComponent(id)}/counseling`, {
      method: 'POST',
      body: { script },
    })
  },

  async refer(id: string, choice: ReferralOption, reasoning: string): Promise<AskResult> {
    return http<AskResult>(`/attempts/${encodeURIComponent(id)}/referral`, {
      method: 'POST',
      body: { choice, reasoning },
    })
  },

  async finish(id: string, durationSeconds: number): Promise<ScenarioAttempt> {
    return http<ScenarioAttempt>(`/attempts/${encodeURIComponent(id)}/finish`, {
      method: 'POST',
      body: { durationSeconds },
    })
  },

  async abandon(id: string): Promise<void> {
    await http<ScenarioAttempt>(`/attempts/${encodeURIComponent(id)}/abandon`, { method: 'POST' })
  },
}
