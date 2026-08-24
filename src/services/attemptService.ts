import type {
  ConversationMessage,
  PatientFact,
  RecommendationOption,
  ReferralOption,
  ScenarioAttempt,
  StudentAction,
} from '@/types'
import { getPatient } from '@/data/patients'
import { evaluateObjectives } from '@/lib/objectives'
import { initialMessages, respond, startingFacts, thinkingDelay } from '@/lib/patientEngine'
import { uid } from '@/lib/utils'
import { notFound, request } from './api'
import { getDb, mutate } from './store'

export interface AskResult {
  attempt: ScenarioAttempt
  messages: ConversationMessage[]
  revealed: PatientFact[]
}

function requireAttempt(id: string): ScenarioAttempt {
  return getDb().attempts[id] ?? notFound('consultation')
}

function patientForAttempt(attempt: ScenarioAttempt) {
  const scenario = getDb().scenarios.find((s) => s.id === attempt.scenarioId)
  const patient = scenario ? getPatient(scenario.patientId) : undefined
  return patient ?? notFound('patient')
}

function recordAction(attempt: ScenarioAttempt, action: Omit<StudentAction, 'id' | 'at'>): StudentAction {
  const full: StudentAction = { id: uid('act'), at: new Date().toISOString(), ...action }
  attempt.actions.push(full)
  return full
}

function refreshObjectives(attempt: ScenarioAttempt) {
  const patient = patientForAttempt(attempt)
  attempt.objectivesMet = evaluateObjectives(attempt, patient.facts)
}

export const attemptService = {
  async start(scenarioId: string): Promise<ScenarioAttempt> {
    return request(
      () => {
        const db = getDb()
        const scenario = db.scenarios.find((s) => s.id === scenarioId) ?? notFound('simulation')
        const patient = getPatient(scenario.patientId) ?? notFound('patient')
        const attempt: ScenarioAttempt = {
          id: uid('att'),
          scenarioId,
          userId: db.user?.id ?? 'usr_guest',
          status: 'in-progress',
          startedAt: new Date().toISOString(),
          durationSeconds: 0,
          messages: initialMessages(patient),
          actions: [],
          revealedFactIds: startingFacts(patient).map((f) => f.id),
          notes: '',
          objectivesMet: [],
        }
        mutate((draft) => {
          draft.attempts[attempt.id] = attempt
          const target = draft.scenarios.find((s) => s.id === scenarioId)
          if (target && target.status !== 'completed') target.status = 'in-progress'
        })
        return attempt
      },
      { latency: 700, label: 'attemptService.start' },
    )
  },

  async get(id: string): Promise<ScenarioAttempt> {
    return request(() => requireAttempt(id), { latency: 200, label: 'attemptService.get' })
  },

  /**
   * Send a question to the simulated patient. In production this becomes
   * `POST /attempts/:id/messages`, with the Patient Agent generating the reply.
   */
  async ask(id: string, question: string): Promise<AskResult> {
    const trimmed = question.trim()
    return request(
      () => {
        const attempt = requireAttempt(id)
        const patient = patientForAttempt(attempt)
        const previousQuestions = attempt.actions.filter((a) => a.type === 'question')
        const unproductiveStreak = (() => {
          let streak = 0
          for (let i = previousQuestions.length - 1; i >= 0; i -= 1) {
            if ((previousQuestions[i].revealed ?? []).length > 0) break
            streak += 1
          }
          return streak
        })()

        const turn = respond(patient, trimmed, {
          revealedFactIds: attempt.revealedFactIds,
          questionCount: previousQuestions.length,
          unproductiveStreak,
          rapportShown: attempt.messages.some((m) => m.tone === 'reassured'),
        })

        const revealedIds = turn.revealed.map((f) => f.id)
        const studentMessage: ConversationMessage = {
          id: uid('msg'),
          author: 'student',
          text: trimmed,
          at: new Date().toISOString(),
        }

        let updated!: ScenarioAttempt
        mutate((draft) => {
          const target = draft.attempts[id]
          target.messages.push(studentMessage, ...turn.messages)
          target.revealedFactIds = [...new Set([...target.revealedFactIds, ...revealedIds])]
          recordAction(target, { type: 'question', content: trimmed, revealed: revealedIds })
          refreshObjectives(target)
          updated = target
        })

        return { attempt: updated, messages: [studentMessage, ...turn.messages], revealed: turn.revealed }
      },
      { latency: thinkingDelay(trimmed), label: 'attemptService.ask' },
    )
  },

  async saveNotes(id: string, notes: string): Promise<ScenarioAttempt> {
    return request(
      () => {
        let updated!: ScenarioAttempt
        mutate((draft) => {
          draft.attempts[id].notes = notes
          updated = draft.attempts[id]
        })
        return updated
      },
      { latency: 120, label: 'attemptService.saveNotes' },
    )
  },

  async tick(id: string, seconds: number): Promise<void> {
    // Timer updates stay local — no simulated latency, no persistence churn.
    const attempt = getDb().attempts[id]
    if (attempt) attempt.durationSeconds = seconds
  },
  async recommend(id: string, choice: RecommendationOption, reasoning: string): Promise<AskResult> {
    return request(
      () => {
        const attempt = requireAttempt(id)
        const patient = patientForAttempt(attempt)
        const systemMessage: ConversationMessage = {
          id: uid('msg'),
          author: 'system',
          text: `You recommended: ${choice}.`,
          at: new Date().toISOString(),
          tone: 'neutral',
        }
        const followUp = patient.followUps.find((f) =>
          f.triggers.some((t) => `${choice} ${reasoning}`.toLowerCase().includes(t.toLowerCase())),
        )
        const patientMessages: ConversationMessage[] = followUp
          ? [{ id: uid('msg'), author: 'patient', text: followUp.line, at: new Date().toISOString(), tone: 'concerned' }]
          : [
              {
                id: uid('msg'),
                author: 'patient',
                text: 'Right — so what should I actually do, then?',
                at: new Date().toISOString(),
                tone: 'neutral',
              },
            ]

        let updated!: ScenarioAttempt
        mutate((draft) => {
          const target = draft.attempts[id]
          target.recommendation = { choice, reasoning }
          target.messages.push(systemMessage, ...patientMessages)
          recordAction(target, { type: 'recommendation', content: reasoning, choice })
          refreshObjectives(target)
          updated = target
        })
        return { attempt: updated, messages: [systemMessage, ...patientMessages], revealed: [] }
      },
      { latency: 480, label: 'attemptService.recommend' },
    )
  },

  async counsel(id: string, script: string): Promise<AskResult> {
    return request(
      () => {
        const attempt = requireAttempt(id)
        const patient = patientForAttempt(attempt)
        const usedJargon = patient.jargon.find((j) => script.toLowerCase().includes(j.toLowerCase()))
        const messages: ConversationMessage[] = [
          { id: uid('msg'), author: 'student', text: script.trim(), at: new Date().toISOString() },
        ]
        messages.push(
          usedJargon
            ? {
                id: uid('msg'),
                author: 'patient',
                text: `Sorry, most of that made sense — but what does “${usedJargon}” mean?`,
                at: new Date().toISOString(),
                tone: 'confused',
              }
            : {
                id: uid('msg'),
                author: 'patient',
                text: 'That is clear, thank you. I think I know what I am doing now.',
                at: new Date().toISOString(),
                tone: 'reassured',
              },
        )

        let updated!: ScenarioAttempt
        mutate((draft) => {
          const target = draft.attempts[id]
          target.counseling = script
          target.messages.push(...messages)
          recordAction(target, { type: 'counseling', content: script })
          refreshObjectives(target)
          updated = target
        })
        return { attempt: updated, messages, revealed: [] }
      },
      { latency: 520, label: 'attemptService.counsel' },
    )
  },

  async refer(id: string, choice: ReferralOption, reasoning: string): Promise<AskResult> {
    return request(
      () => {
        const messages: ConversationMessage[] = [
          {
            id: uid('msg'),
            author: 'system',
            text: `Referral decision recorded: ${choice}.`,
            at: new Date().toISOString(),
            tone: choice === 'No referral' ? 'neutral' : 'concerned',
          },
        ]
        if (choice !== 'No referral') {
          messages.push({
            id: uid('msg'),
            author: 'patient',
            text: 'All right. Where exactly do I go, and how soon?',
            at: new Date().toISOString(),
            tone: 'concerned',
          })
        }

        let updated!: ScenarioAttempt
        mutate((draft) => {
          const target = draft.attempts[id]
          target.referral = { choice, reasoning }
          target.messages.push(...messages)
          recordAction(target, { type: 'referral', content: reasoning, choice })
          refreshObjectives(target)
          updated = target
        })
        return { attempt: updated, messages, revealed: [] }
      },
      { latency: 460, label: 'attemptService.refer' },
    )
  },

  async finish(id: string, durationSeconds: number): Promise<ScenarioAttempt> {
    return request(
      () => {
        let updated!: ScenarioAttempt
        mutate((draft) => {
          const target = draft.attempts[id]
          target.status = 'submitted'
          target.finishedAt = new Date().toISOString()
          target.durationSeconds = durationSeconds
          recordAction(target, { type: 'finish', content: 'Consultation submitted for evaluation.' })
          updated = target
        })
        return updated
      },
      { latency: 300, label: 'attemptService.finish' },
    )
  },

  async abandon(id: string): Promise<void> {
    return request(
      () => {
        mutate((draft) => {
          const target = draft.attempts[id]
          if (target && target.status === 'in-progress') target.status = 'abandoned'
        })
      },
      { latency: 150, label: 'attemptService.abandon' },
    )
  },
}

