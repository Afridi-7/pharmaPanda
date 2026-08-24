import type { ConversationMessage, Patient, PatientFact } from '@/types'
import { matchesAny, normalise, pick, uid } from '@/lib/utils'

/**
 * Deterministic mock patient engine.
 *
 * Everything the simulated patient says is derived from scenario data plus the
 * student's question — no LLM involved. `respond()` is intentionally a pure
 * function of (patient, question, state) so it can be swapped for an HTTP call
 * to the backend Patient Agent later:
 *
 *   const turn = await patientService.ask(attemptId, question)
 *
 * ...returning the same PatientTurn shape.
 */

export interface PatientEngineState {
  revealedFactIds: string[]
  /** Number of questions asked so far — drives patience and pacing. */
  questionCount: number
  /** Consecutive questions that revealed nothing. */
  unproductiveStreak: number
  rapportShown: boolean
}

export interface PatientTurn {
  messages: ConversationMessage[]
  revealed: PatientFact[]
  /** Set when the student used clinical jargon the patient did not follow. */
  confused: boolean
  mood: Patient['mood']
}

const GREETING_KEYWORDS = [
  'hello',
  'hi',
  'good morning',
  'good afternoon',
  'my name is',
  'i am the pharmacist',
  'how can i help',
  'how are you',
  'sorry to hear',
  'that sounds',
  'take a seat',
  'privacy',
  'private',
]

const OPEN_PROMPTS = [
  'tell me more',
  'anything else',
  'what else',
  'go on',
  'describe',
  'walk me through',
  'is there anything',
]

const CLOSING_KEYWORDS = ['any questions', 'does that make sense', 'is that clear', 'to summarise', 'to summarize']

function message(
  author: ConversationMessage['author'],
  text: string,
  extra: Partial<ConversationMessage> = {},
): ConversationMessage {
  return { id: uid('msg'), author, text, at: new Date().toISOString(), ...extra }
}

export function initialMessages(patient: Patient): ConversationMessage[] {
  return [
    message('system', `${patient.name} approaches the counter.`, { tone: 'neutral' }),
    message('patient', patient.openingLine, { tone: patient.mood === 'worried' ? 'concerned' : 'neutral' }),
  ]
}

export function startingFacts(patient: Patient) {
  return patient.facts.filter((f) => f.revealedAtStart)
}

/** Facts unlocked by a given question, excluding anything already revealed. */
function matchFacts(patient: Patient, question: string, revealedIds: string[]) {
  return patient.facts.filter(
    (fact) => !fact.revealedAtStart && !revealedIds.includes(fact.id) && matchesAny(question, fact.triggers),
  )
}

function nextUnrevealed(patient: Patient, revealedIds: string[], section: PatientFact['section'][]) {
  return patient.facts.find(
    (f) => !f.revealedAtStart && !revealedIds.includes(f.id) && section.includes(f.section),
  )
}

export function respond(patient: Patient, question: string, state: PatientEngineState): PatientTurn {
  const text = normalise(question)
  const seed = state.questionCount + text.length
  const messages: ConversationMessage[] = []
  let revealed: PatientFact[] = []
  let mood = patient.mood
  let confused = false

  const usedJargon = patient.jargon.filter((j) => matchesAny(text, [j]))
  const isGreeting = matchesAny(text, GREETING_KEYWORDS)
  const isOpenPrompt = matchesAny(text, OPEN_PROMPTS)
  const isClosing = matchesAny(text, CLOSING_KEYWORDS)

  revealed = matchFacts(patient, question, state.revealedFactIds).slice(0, 2)

  // An open invitation nudges the patient to volunteer the next symptom detail.
  if (revealed.length === 0 && isOpenPrompt) {
    const volunteered = nextUnrevealed(patient, state.revealedFactIds, ['symptoms', 'other'])
    if (volunteered) revealed = [volunteered]
  }

  if (isGreeting && !state.rapportShown) {
    mood = patient.mood === 'impatient' ? 'calm' : patient.mood
    messages.push(
      message('patient', pick(
        [
          'Thank you — that is kind of you to ask.',
          'I appreciate you taking the time.',
          'Yes, thank you. It has been a bit of a day.',
        ],
        seed,
      ), { tone: 'reassured' }),
    )
  }

  // Jargon the patient cannot parse: they say so, and only partially engage.
  if (usedJargon.length > 0) {
    confused = true
    messages.push(
      message('patient', `Sorry — “${usedJargon[0]}”? I do not know what that means.`, { tone: 'confused' }),
    )
    messages.push(message('system', `${patient.name} did not understand the terminology you used.`, { tone: 'confused' }))
  }

  if (revealed.length > 0) {
    revealed.forEach((fact) => {
      messages.push(
        message('patient', fact.patientLine, {
          revealed: [fact.id],
          tone: fact.safetyCritical ? 'concerned' : 'neutral',
        }),
      )
    })
  }

  // Patient-initiated follow-up questions, driven by what the student mentioned.
  const followUp = patient.followUps.find((f) => matchesAny(text, f.triggers))
  if (followUp) {
    messages.push(message('patient', followUp.line, { tone: 'concerned' }))
  }

  if (messages.length === 0) {
    if (isClosing) {
      messages.push(
        message('patient', 'I think so. Let me make sure I have it right before I go.', { tone: 'reassured' }),
      )
    } else if (state.unproductiveStreak >= 2 && patient.impatientLines.length > 0) {
      mood = 'impatient'
      messages.push(message('patient', pick(patient.impatientLines, seed), { tone: 'impatient' }))
    } else {
      messages.push(message('patient', pick(patient.deflections, seed), { tone: 'neutral' }))
    }
  }

  if (revealed.some((f) => f.safetyCritical)) {
    messages.push(
      message('system', 'A safety-relevant detail has been added to Patient Information.', { tone: 'concerned' }),
    )
  }

  return { messages, revealed, confused, mood }
}

/** Latency used to make the patient feel like they are thinking. */
export function thinkingDelay(question: string) {
  return 550 + Math.min(1200, question.length * 12)
}
