import type { AttemptSummary, DashboardSnapshot } from '@/types'
import { weeklyActivityFrom } from '@/data/attempts'
import { greetingForNow } from '@/lib/utils'
import { request } from './api'
import { getDb } from './store'

export const dashboardService = {
  async snapshot(): Promise<DashboardSnapshot> {
    return request(
      () => {
        const db = getDb()
        const competencies = db.competencies
        const overallScore = Math.round(
          competencies.reduce((sum, c) => sum + c.score, 0) / Math.max(1, competencies.length),
        )
        const byKey = (key: string) => competencies.find((c) => c.key === key)?.score ?? 0

        const continueScenario =
          db.scenarios.find((s) => s.status === 'in-progress') ??
          db.scenarios.find((s) => s.status === 'not-started') ??
          db.scenarios[0]

        // The adaptive recommendation is simply the weakest competency, mapped to
        // a case that trains it. The backend will do this with more signal.
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
          db.scenarios.find((s) => s.id === recommendedId && s.id !== continueScenario.id) ??
          db.scenarios.find((s) => s.status === 'not-started') ??
          db.scenarios[1]

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
          recommendationReason: `Your recent cases show that ${weakest.label.toLowerCase()} is your weakest competency.`,
          recentAttempts: db.history.slice(0, 6),
          weeklyActivity: weeklyActivityFrom(db.history),
        }
      },
      { latency: 420, label: 'dashboardService.snapshot' },
    )
  },

  async history(filter: 'all' | 'completed' | 'needs-review' | 'high-score' = 'all'): Promise<AttemptSummary[]> {
    return request(
      () => {
        const rows = getDb().history
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
      { latency: 300, label: 'dashboardService.history' },
    )
  },
}
