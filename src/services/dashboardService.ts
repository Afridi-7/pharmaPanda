import type { AttemptSummary, Competency, DashboardSnapshot } from '@/types'
import { competencySeed } from '@/data/users'
import { weeklyActivityFrom } from '@/data/attempts'
import { greetingForNow } from '@/lib/utils'
import { http } from './http'
import { scenarioService } from './scenarioService'

/**
 * Dashboard snapshot.
 *
 * History and scenario progress come from the API. Competency aggregation is
 * still derived here from the caller's own reports — a dedicated progress
 * endpoint is the next thing to move server-side.
 */
function competenciesFrom(reports: { key: string; score: number }[][]): Competency[] {
  return competencySeed.map((competency) => {
    const observed = reports
      .map((scores) => scores.find((s) => s.key === competency.key)?.score)
      .filter((s): s is number => typeof s === 'number')

    if (observed.length === 0) return competency

    const score = Math.round(observed.reduce((sum, s) => sum + s, 0) / observed.length)
    const previous = observed.length > 1
      ? Math.round(observed.slice(0, -1).reduce((sum, s) => sum + s, 0) / (observed.length - 1))
      : score
    const delta = score - previous

    return {
      ...competency,
      score,
      previousScore: previous,
      attempts: observed.length,
      trendLabel: observed.length > 1 ? `${delta >= 0 ? '+' : ''}${delta}% since last` : 'First attempt',
      history: observed.map((s, i) => ({ label: `#${i + 1}`, score: s })),
    }
  })
}

export const dashboardService = {
  async snapshot(): Promise<DashboardSnapshot> {
    const [history, scenarios] = await Promise.all([
      http<AttemptSummary[]>('/attempts'),
      scenarioService.list(),
    ])

    // Competency detail lives on each report, so only fetch what we need.
    const evaluated = history.slice(0, 10)
    const reports = await Promise.all(
      evaluated.map((row) =>
        http<{ scores: { key: string; score: number }[] }>(`/attempts/${row.attemptId}/evaluation`)
          .then((r) => r.scores)
          .catch(() => []),
      ),
    )
    const competencies = competenciesFrom(reports.filter((r) => r.length > 0))

    const overallScore = competencies.some((c) => c.attempts > 0)
      ? Math.round(competencies.reduce((sum, c) => sum + c.score, 0) / Math.max(1, competencies.length))
      : 0
    const byKey = (key: string) => competencies.find((c) => c.key === key)?.score ?? 0

    const continueScenario =
      scenarios.find((s) => s.status === 'in-progress') ??
      scenarios.find((s) => s.status === 'not-started') ??
      scenarios[0]

    const weakest = [...competencies].sort((a, b) => a.score - b.score)[0]
    const trainingMap: Record<string, string> = {
      counseling: 'sc_inhaler',
      communication: 'sc_inhaler',
      historyTaking: 'sc_cough',
      clinicalReasoning: 'sc_wound',
      medicationSafety: 'sc_interaction',
      referralDecisions: 'sc_cough',
    }
    const recommendedId = trainingMap[weakest.key] ?? 'sc_inhaler'
    const recommendedScenario =
      scenarios.find((s) => s.id === recommendedId && s.id !== continueScenario?.id) ??
      scenarios.find((s) => s.status === 'not-started') ??
      scenarios[1]

    return {
      greeting: greetingForNow(),
      overallScore,
      metrics: [
        { label: 'Overall Score', value: overallScore },
        { label: 'Clinical Reasoning', value: byKey('clinicalReasoning') },
        { label: 'Medication Safety', value: byKey('medicationSafety') },
        { label: 'Communication', value: byKey('communication') },
        { label: 'History Taking', value: byKey('historyTaking') },
      ],
      competencies,
      continueScenario,
      recommendedScenario,
      recommendationReason: weakest.attempts > 0
        ? `Your recent cases show that ${weakest.label.toLowerCase()} is your weakest competency.`
        : 'Start with a case that exercises history taking and medication safety.',
      recentAttempts: history.slice(0, 6),
      weeklyActivity: weeklyActivityFrom(history),
    }
  },

  async history(filter: 'all' | 'completed' | 'needs-review' | 'high-score' = 'all'): Promise<AttemptSummary[]> {
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
