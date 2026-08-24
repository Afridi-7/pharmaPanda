import type { AttemptSummary, DashboardSnapshot } from '@/types'
import { greetingForNow } from '@/lib/utils'
import { http } from './http'
import { progressService } from './progressService'
import { scenarioService } from './scenarioService'

/**
 * Dashboard snapshot.
 *
 * Three parallel requests: progress (competencies, achievements, activity),
 * the scenario catalogue, and recent history. Competency aggregation used to
 * happen here over one request per report; it now runs server-side in a single
 * query behind `/api/progress`.
 */
export const dashboardService = {
  async snapshot(): Promise<DashboardSnapshot> {
    const [progress, scenarios, history] = await Promise.all([
      progressService.snapshot(),
      scenarioService.list(),
      http<AttemptSummary[]>('/attempts'),
    ])

    const byKey = (key: string) =>
      progress.competencies.find((c) => c.key === key)?.score ?? 0

    const continueScenario =
      scenarios.find((s) => s.status === 'in-progress') ??
      scenarios.find((s) => s.status === 'not-started') ??
      scenarios[0]

    const recommendedScenario =
      scenarios.find(
        (s) => s.id === progress.recommendedScenarioSlug && s.id !== continueScenario?.id,
      ) ??
      scenarios.find((s) => s.status === 'not-started' && s.id !== continueScenario?.id) ??
      scenarios[1]

    return {
      greeting: greetingForNow(),
      overallScore: progress.overallScore,
      metrics: [
        { label: 'Overall Score', value: progress.overallScore },
        { label: 'Clinical Reasoning', value: byKey('clinicalReasoning') },
        { label: 'Medication Safety', value: byKey('medicationSafety') },
        { label: 'Communication', value: byKey('communication') },
        { label: 'History Taking', value: byKey('historyTaking') },
      ],
      competencies: progress.competencies,
      continueScenario,
      recommendedScenario,
      recommendationReason: progress.recommendationReason,
      recentAttempts: history.slice(0, 6),
      weeklyActivity: progress.weeklyActivity,
    }
  },

  async history(
    filter: 'all' | 'completed' | 'needs-review' | 'high-score' = 'all',
  ): Promise<AttemptSummary[]> {
    const rows = await http<AttemptSummary[]>('/attempts')
    switch (filter) {
      case 'completed':
        return rows.filter((r) => r.status === 'Completed')
      case 'needs-review':
        return rows.filter((r) => r.status === 'Needs review')
      case 'high-score':
        return rows.filter((r) => r.score >= 85)
      default:
        return rows
    }
  },
}
