import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { AttemptSummary } from '@/types'
import { buttonVariants } from '@/components/ui/Button'
import { Tabs } from '@/components/ui/Switch'
import { StatCard } from '@/components/common/Score'
import { AttemptTable } from '@/components/common/ScenarioCard'
import { CardSkeletonGrid, EmptyState, ErrorState, PageHeader } from '@/components/common/States'
import { useAsync } from '@/hooks/useAsync'
import { dashboardService } from '@/services'
import { cn } from '@/lib/utils'

type Filter = 'all' | 'completed' | 'needs-review' | 'high-score'

const filters: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'completed', label: 'Completed' },
  { value: 'needs-review', label: 'Needs review' },
  { value: 'high-score', label: 'High scores' },
]

function matches(attempt: AttemptSummary, filter: Filter): boolean {
  switch (filter) {
    case 'completed':
      return attempt.status === 'Completed'
    case 'needs-review':
      return attempt.status === 'Needs review'
    case 'high-score':
      return attempt.score >= 85
    default:
      return true
  }
}

/**
 * Consultation history.
 *
 * Rows come from the API and belong to the signed-in account, so the list is
 * the same on any device. Filtering is client-side: the fetched set is small
 * and switching filters should not cost a round trip.
 */
export function HistoryPage() {
  const { data, loading, error, reload } = useAsync(() => dashboardService.history('all'), [])
  const [filter, setFilter] = useState<Filter>('all')

  const rows = useMemo(() => (data ?? []).filter((a) => matches(a, filter)), [data, filter])

  const stats = useMemo(() => {
    const all = data ?? []
    const scored = all.filter((a) => a.status !== 'Abandoned')
    const average = scored.length
      ? Math.round(scored.reduce((sum, a) => sum + a.score, 0) / scored.length)
      : 0
    const best = scored.length ? Math.max(...scored.map((a) => a.score)) : 0
    return { total: all.length, average, best }
  }, [data])

  if (loading) return <CardSkeletonGrid count={3} />
  if (error || !data) return <ErrorState message={error ?? undefined} onRetry={reload} />

  return (
    <div className="space-y-6">
      <PageHeader
        title="History"
        subtitle="Every consultation you have completed, with its score and report."
      />

      {data.length === 0 ? (
        <EmptyState
          title="No consultations yet"
          description="Finished consultations appear here with their score and full report."
          action={
            <Link to="/simulations" className={cn(buttonVariants({ variant: 'primary', size: 'sm' }))}>
              Browse simulations
            </Link>
          }
        />
      ) : (
        <>
          <section aria-label="Summary" className="grid gap-3 sm:grid-cols-3">
            <StatCard label="Consultations" value={stats.total} suffix="" />
            <StatCard label="Average Score" value={stats.average} />
            <StatCard label="Best Score" value={stats.best} />
          </section>

          <Tabs value={filter} onChange={setFilter} tabs={filters} />

          {rows.length === 0 ? (
            <EmptyState
              title="Nothing matches that filter"
              description="Try a different filter to see more of your history."
            />
          ) : (
            <section className="rounded-2xl border border-beige bg-cream-light p-5 shadow-soft sm:p-6">
              <p className="mb-3 text-xs text-ink-muted">
                Showing {rows.length} of {data.length}{' '}
                {data.length === 1 ? 'consultation' : 'consultations'}
              </p>
              <AttemptTable attempts={rows} caption="Your consultation history" />
            </section>
          )}
        </>
      )}
    </div>
  )
}
