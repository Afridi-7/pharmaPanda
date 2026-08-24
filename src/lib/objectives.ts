import type { PatientFact, ScenarioAttempt } from '@/types'

export interface ObjectiveDefinition {
  id: string
  label: string
  hint: string
}

/**
 * The six consultation objectives shown in the simulation workspace. They tell
 * the student *what kind* of work is expected without revealing the answers.
 */
export const consultationObjectives: ObjectiveDefinition[] = [
  { id: 'history', label: 'Gather relevant history', hint: 'Onset, duration, severity, what has been tried.' },
  { id: 'red-flags', label: 'Screen for red flags', hint: 'Actively rule out the things that would stop self-care.' },
  { id: 'safety', label: 'Assess medication safety', hint: 'Allergies, current medicines, relevant conditions.' },
  { id: 'action', label: 'Determine appropriate action', hint: 'Commit to a recommendation and justify it.' },
  { id: 'counsel', label: 'Counsel the patient', hint: 'Explain the plan in language the patient can use.' },
  { id: 'referral', label: 'Decide whether referral is needed', hint: 'Say what should happen next, and how urgently.' },
]

/**
 * Objective completion is derived from behaviour, never self-reported. Called
 * after every action so the checklist updates live.
 */
export function evaluateObjectives(attempt: ScenarioAttempt, facts: PatientFact[]): string[] {
  const revealed = facts.filter((f) => attempt.revealedFactIds.includes(f.id) && !f.revealedAtStart)
  const met = new Set<string>()

  const historyish = revealed.filter((f) => f.section === 'symptoms' || f.section === 'other' || f.section === 'history')
  if (historyish.length >= 2) met.add('history')

  const redFlagFacts = revealed.filter((f) => f.credits === 'clinicalReasoning')
  if (redFlagFacts.length >= 1) met.add('red-flags')

  const safetyFacts = revealed.filter(
    (f) => f.section === 'allergies' || f.section === 'medications' || f.credits === 'medicationSafety',
  )
  if (safetyFacts.length >= 2) met.add('safety')

  if (attempt.recommendation) met.add('action')
  if (attempt.counseling && attempt.counseling.trim().length > 30) met.add('counsel')
  if (attempt.referral) met.add('referral')

  return [...met]
}
