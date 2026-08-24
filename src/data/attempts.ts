import type { AttemptSummary } from '@/types'

/**
 * Consultation history.
 *
 * Empty by design: a new account has not completed anything, and inventing
 * attempts would show scores the user never earned. Rows are appended by
 * `evaluationService.evaluate()` as real consultations are finished.
 */
export const attemptHistory: AttemptSummary[] = []

/** Consultations per weekday, derived from real attempts rather than seeded. */
export function weeklyActivityFrom(history: AttemptSummary[]) {
  const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const counts = new Map(labels.map((label) => [label, 0]))

  const now = Date.now()
  const weekAgo = now - 7 * 86_400_000

  for (const attempt of history) {
    const at = new Date(attempt.date).getTime()
    if (Number.isNaN(at) || at < weekAgo || at > now) continue
    // getDay(): 0 = Sunday, so shift to a Monday-first week.
    const label = labels[(new Date(at).getDay() + 6) % 7]
    counts.set(label, (counts.get(label) ?? 0) + 1)
  }

  return labels.map((label) => ({ label, consultations: counts.get(label) ?? 0 }))
}
