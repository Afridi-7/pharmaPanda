import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search } from 'lucide-react'
import type { Drug } from '@/types'
import { Badge } from '@/components/ui/Badge'
import { CardSkeletonGrid, EmptyState, ErrorState, PageHeader } from '@/components/common/States'
import { useAsync } from '@/hooks/useAsync'
import { drugService } from '@/services'

/**
 * Drug reference.
 *
 * The whole set is fetched once and filtered in memory — it is small, and
 * searching should not cost a round trip per keystroke.
 */
export function DrugsPage() {
  const { data, loading, error, reload } = useAsync(() => drugService.search(''), [])
  const [query, setQuery] = useState('')
  const [debounced, setDebounced] = useState('')

  useEffect(() => {
    const handle = window.setTimeout(() => setDebounced(query), 150)
    return () => window.clearTimeout(handle)
  }, [query])

  const results = useMemo(() => {
    const needle = debounced.trim().toLowerCase()
    if (!needle) return data ?? []
    return (data ?? []).filter((drug) =>
      [drug.name, drug.genericFor ?? '', drug.drugClass, drug.summary, ...drug.commonUses]
        .join(' ')
        .toLowerCase()
        .includes(needle),
    )
  }, [data, debounced])

  if (loading) return <CardSkeletonGrid count={6} />
  if (error || !data) return <ErrorState message={error ?? undefined} onRetry={reload} />

  return (
    <div className="space-y-6">
      <PageHeader
        title="Drug Knowledge"
        subtitle="Counselling points, interactions and safety considerations for the agents these cases use."
      />

      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted"
          strokeWidth={1.9}
        />
        <label htmlFor="drug-search" className="sr-only">
          Search drugs
        </label>
        <input
          id="drug-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by name, class or use…"
          autoComplete="off"
          className="h-11 w-full rounded-xl border border-beige-dark bg-cream-light pl-10 pr-3.5 text-sm text-ink placeholder:text-ink-muted/70 focus:border-moss focus:outline-none focus:ring-2 focus:ring-moss/30"
        />
      </div>

      {results.length === 0 ? (
        <EmptyState
          title="No drugs match that search"
          description="Try a drug class such as “NSAID”, or a use such as “pain”."
        />
      ) : (
        <>
          <p className="text-xs text-ink-muted">
            Showing {results.length} of {data.length}
          </p>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {results.map((drug) => (
              <DrugCard key={drug.id} drug={drug} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function DrugCard({ drug }: { drug: Drug }) {
  return (
    <Link
      to={`/drugs/${drug.id}`}
      className="flex flex-col rounded-2xl border border-beige bg-cream-light p-5 shadow-soft transition-colors hover:border-sage"
    >
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="font-display text-[17px] text-forest">{drug.name}</h2>
        <Badge tone="neutral">{drug.drugClass}</Badge>
      </div>

      {drug.genericFor && (
        <p className="mt-0.5 text-[11px] text-ink-muted">Generic for {drug.genericFor}</p>
      )}

      <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-muted">{drug.summary}</p>

      <ul className="mt-3 flex flex-wrap gap-1.5">
        {drug.commonUses.slice(0, 3).map((use) => (
          <li key={use} className="rounded-lg bg-cream px-2 py-0.5 text-[11px] text-ink-muted">
            {use}
          </li>
        ))}
      </ul>
    </Link>
  )
}
