import type { AttemptSummary, CompetencyKey, Evaluation } from '@/types'
import { getPatient } from '@/data/patients'
import { competencyLabels } from '@/data/users'
import { computeEvaluation, evaluationStages, ruleFor } from '@/lib/evaluationEngine'
import { clamp, uid } from '@/lib/utils'
import { notFound, request } from './api'
import { getDb, mutate } from './store'

const WEIGHT_ORDER: CompetencyKey[] = [
  'clinicalReasoning',
  'medicationSafety',
  'historyTaking',
  'communication',
  'counseling',
  'referralDecisions',
]

/**
 * Reconstructs a plausible report for the seeded historical attempts, so that
 * every row in History opens a real results page. Live attempts always use the
 * behaviour-driven engine instead.
 */
function archivedEvaluation(summary: AttemptSummary): Evaluation {
  const rule = ruleFor(summary.scenarioId)
  const spread = [4, -2, -6, 2, -4, 7]
  const scores = WEIGHT_ORDER.map((key, index) => ({
    key,
    label: competencyLabels[key],
    score: Math.round(clamp(summary.score + spread[index], 20, 99)),
  }))
  const weak = [...scores].sort((a, b) => a.score - b.score)[0]
  const strong = [...scores].sort((a, b) => b.score - a.score)[0]

  return {
    id: `eval_archive_${summary.attemptId}`,
    attemptId: summary.attemptId,
    scenarioId: summary.scenarioId,
    scenarioTitle: summary.scenarioTitle,
    totalScore: summary.score,
    headline: summary.score >= 85 ? 'An excellent consultation' : summary.score >= 70 ? 'Good work' : 'Plenty to build on',
    pandaMessage:
      summary.status === 'Abandoned'
        ? 'This attempt was ended before a decision was recorded.'
        : `Strongest domain: ${strong.label.toLowerCase()}. Weakest: ${weak.label.toLowerCase()}.`,
    scores,
    strengths: [
      { id: uid('hl'), title: `Strong ${strong.label.toLowerCase()}`, detail: `You scored ${strong.score} in ${strong.label} on this case.` },
      { id: uid('hl'), title: 'Reached a decision', detail: 'You committed to a plan and explained it to the patient.' },
    ],
    missed: [
      {
        id: uid('hl'),
        title: `${weak.label} held the score back`,
        detail: `This was your lowest domain at ${weak.score}. Focus on it when you repeat the case.`,
      },
    ],
    safetyIssues: [],
    timeline: [
      { id: uid('tl'), kind: 'student-ask', label: 'Consultation opened', detail: `${summary.scenarioTitle} — ${summary.durationLabel}` },
      { id: uid('tl'), kind: 'student-decision', label: 'Decision recorded', detail: 'Archived attempt. The full transcript is not retained.' },
    ],
    betterApproach: rule.betterApproach,
    nextScenarioId: rule.nextScenarioId,
    nextScenarioReason: rule.nextScenarioReason,
    createdAt: summary.date,
  }
}

export const evaluationService = {
  stages: evaluationStages,

  /** Runs the mock evaluation engine and commits the resulting progress. */
  async evaluate(attemptId: string): Promise<Evaluation> {
    return request(
      () => {
        const db = getDb()
        const attempt = db.attempts[attemptId] ?? notFound('consultation')
        const scenario = db.scenarios.find((s) => s.id === attempt.scenarioId) ?? notFound('simulation')
        const patient = getPatient(scenario.patientId) ?? notFound('patient')
        const evaluation = computeEvaluation(attempt, scenario, patient)

        mutate((draft) => {
          draft.evaluations[evaluation.id] = evaluation
          const target = draft.attempts[attemptId]
          target.status = 'evaluated'
          target.evaluationId = evaluation.id
          target.score = evaluation.totalScore

          const scenarioRow = draft.scenarios.find((s) => s.id === scenario.id)
          if (scenarioRow) {
            scenarioRow.status = 'completed'
            scenarioRow.previousScore = evaluation.totalScore
            scenarioRow.lastAttemptId = attemptId
          }

          const summary: AttemptSummary = {
            attemptId,
            scenarioId: scenario.id,
            scenarioTitle: scenario.title,
            category: scenario.category,
            score: evaluation.totalScore,
            date: new Date().toISOString(),
            durationLabel: `${Math.max(1, Math.round(target.durationSeconds / 60))} min`,
            status: evaluation.safetyIssues.length > 0 || evaluation.totalScore < 75 ? 'Needs review' : 'Completed',
          }
          draft.history = [summary, ...draft.history.filter((h) => h.attemptId !== attemptId)]

          // Competency profile moves gently towards the new observation.
          draft.competencies = draft.competencies.map((competency) => {
            const observed = evaluation.scores.find((s) => s.key === competency.key)
            if (!observed) return competency
            const previousScore = competency.score
            const blended = Math.round(previousScore * 0.75 + observed.score * 0.25)
            const delta = blended - previousScore
            return {
              ...competency,
              previousScore,
              score: blended,
              attempts: competency.attempts + 1,
              trendLabel: `${delta >= 0 ? '+' : ''}${delta}% after this case`,
              history: [...competency.history.slice(-5), { label: 'Now', score: blended }],
            }
          })

          // Achievements react to real behaviour.
          draft.achievements = draft.achievements.map((achievement) => {
            if (achievement.id === 'ach_first_patient' && !achievement.unlocked) {
              return { ...achievement, unlocked: true, unlockedAt: new Date().toISOString() }
            }
            if (achievement.id === 'ach_perfect' && evaluation.totalScore >= 95) {
              return { ...achievement, unlocked: true, unlockedAt: new Date().toISOString() }
            }
            if (achievement.id === 'ach_communicator' && evaluation.scores.find((s) => s.key === 'communication')!.score >= 85) {
              const current = Math.min((achievement.progress?.current ?? 0) + 1, achievement.progress?.target ?? 3)
              const target = achievement.progress?.target ?? 3
              return {
                ...achievement,
                progress: { current, target },
                unlocked: current >= target,
                unlockedAt: current >= target ? new Date().toISOString() : undefined,
              }
            }
            return achievement
          })
        })

        return evaluation
      },
      { latency: 900, label: 'evaluationService.evaluate' },
    )
  },

  async getByAttempt(attemptId: string): Promise<Evaluation> {
    return request(
      () => {
        const db = getDb()
        const live = Object.values(db.evaluations).find((e) => e.attemptId === attemptId)
        if (live) return live
        const summary = db.history.find((h) => h.attemptId === attemptId)
        if (summary) return archivedEvaluation(summary)
        return notFound('report')
      },
      { latency: 320, label: 'evaluationService.getByAttempt' },
    )
  },
}
