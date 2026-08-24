import { useMemo, useState } from 'react'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import type { Difficulty, ScenarioCategory } from '@/types'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Tabs } from '@/components/ui/Switch'
import { ScenarioCard } from '@/components/common/ScenarioCard'
import { CardSkeletonGrid, EmptyState, ErrorState, PageHeader } from '@/components/common/States'
import { useAsync } from '@/hooks/useAsync'
import { scenarioService } from '@/services'
import { scenarioCategories } from '@/data/categories'
import { cn } from '@/lib/utils'

const difficulties: Difficulty[] = ['Beginner', 'Intermediate', 'Advanced']
const durations = [
  { label: 'Any length', value: 0 },
  { label: 'Up to 8 min', value: 8 },
  { label: 'Up to 12 min', value: 12 },
  { label: 'Up to 15 min', value: 15 },
]

type StatusFilter = 'all' | 'not-started' | 'in-progress' | 'completed'

export function SimulationsPage() {
  const [search, setSearch] = useState('')
  const [categories, setCategories] = useState<ScenarioCategory[]>([])
  const [difficulty, setDifficulty] = useState<Difficulty[]>([])
  const [maxDuration, setMaxDuration] = useState(0)
  const [status, setStatus] = useState<StatusFilter>('all')
  const [filtersOpen, setFiltersOpen] = useState(false)

  const { data, loading, error, reload } = useAsync(() => scenarioService.list(), [])

  const filtered = useMemo(() => {
    if (!data) return []
    const needle = search.trim().toLowerCase()
    return data.filter((scenario) => {
      if (needle) {
        const haystack = [scenario.title, scenario.tagline, scenario.description, scenario.category, ...scenario.skills]
          .join(' ')
          .toLowerCase()
        if (!haystack.includes(needle)) return false
      }
      if (categories.length > 0 && !categories.includes(scenario.category)) return false
      if (difficulty.length > 0 && !difficulty.includes(scenario.difficulty)) return false
      if (maxDuration > 0 && scenario.durationMinutes[1] > maxDuration) return false
      if (status !== 'all' && scenario.status !== status) return false
      return true
    })
  }, [data, search, categories, difficulty, maxDuration, status])

  const toggleCategory = (category: ScenarioCategory) =>
    setCategories((prev) => (prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]))
  const toggleDifficulty = (level: Difficulty) =>
    setDifficulty((prev) => (prev.includes(level) ? prev.filter((d) => d !== level) : [...prev, level]))

  const activeFilters = categories.length + difficulty.length + (maxDuration > 0 ? 1 : 0)
  const clearAll = () => {
    setCategories([])
    setDifficulty([])
    setMaxDuration(0)
    setSearch('')
    setStatus('all')
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Simulations"
        subtitle="Ten consultation cases across pain, respiratory, GI, dermatology and drug interactions."
        actions={
          <Button variant="secondary" onClick={() => setFiltersOpen((prev) => !prev)} aria-expanded={filtersOpen}>
            <SlidersHorizontal className="h-4 w-4" strokeWidth={1.9} />
            Filters
            {activeFilters > 0 && <span className="rounded-full bg-forest px-1.5 text-[11px] text-cream-light">{activeFilters}</span>}
          </Button>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" strokeWidth={1.9} />
          <label htmlFor="scenario-search" className="sr-only">
            Search simulations
          </label>
          <input
            id="scenario-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search cases, categories or skills…"
            className="h-11 w-full rounded-xl border border-beige-dark bg-cream-light pl-10 pr-3.5 text-sm text-ink placeholder:text-ink-muted/70 focus:border-moss focus:outline-none focus:ring-2 focus:ring-moss/30"
          />
        </div>
        <Tabs
          value={status}
          onChange={setStatus}
          tabs={[
            { value: 'all', label: 'All' },
            { value: 'not-started', label: 'Not started' },
            { value: 'in-progress', label: 'In progress' },
            { value: 'completed', label: 'Completed' },
          ]}
        />
      </div>

      {filtersOpen && (
        <div className="rounded-2xl border border-beige bg-cream-light p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <h2 className="font-display text-[15px] text-forest">Refine</h2>
            <button type="button" onClick={clearAll} className="text-xs font-medium text-moss-600 hover:underline">
              Clear all
            </button>
          </div>

          <fieldset className="mt-4">
            <legend className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-muted">Category</legend>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {scenarioCategories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => toggleCategory(category)}
                  aria-pressed={categories.includes(category)}
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs transition-colors',
                    categories.includes(category)
                      ? 'border-moss bg-sage-100 font-medium text-forest'
                      : 'border-beige-dark bg-cream text-ink-muted hover:border-sage',
                  )}
                >
                  {category}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <fieldset>
              <legend className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-muted">Difficulty</legend>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {difficulties.map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => toggleDifficulty(level)}
                    aria-pressed={difficulty.includes(level)}
                    className={cn(
                      'rounded-full border px-3 py-1 text-xs transition-colors',
                      difficulty.includes(level)
                        ? 'border-moss bg-sage-100 font-medium text-forest'
                        : 'border-beige-dark bg-cream text-ink-muted hover:border-sage',
                    )}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-muted">Duration</legend>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {durations.map((option) => (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() => setMaxDuration(option.value)}
                    aria-pressed={maxDuration === option.value}
                    className={cn(
                      'rounded-full border px-3 py-1 text-xs transition-colors',
                      maxDuration === option.value
                        ? 'border-moss bg-sage-100 font-medium text-forest'
                        : 'border-beige-dark bg-cream text-ink-muted hover:border-sage',
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </fieldset>
          </div>
        </div>
      )}

      {activeFilters > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {[...categories, ...difficulty].map((item) => (
            <Badge key={item} tone="sage">
              {item}
              <button
                type="button"
                aria-label={`Remove ${item} filter`}
                onClick={() =>
                  difficulties.includes(item as Difficulty)
                    ? toggleDifficulty(item as Difficulty)
                    : toggleCategory(item as ScenarioCategory)
                }
              >
                <X className="h-3 w-3" strokeWidth={2.4} />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {loading && <CardSkeletonGrid />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {!loading && !error && filtered.length === 0 && (
        <EmptyState
          title="No matching cases"
          description="Try clearing a filter, or search by symptom instead."
          action={
            <Button variant="secondary" size="sm" onClick={clearAll}>
              Clear filters
            </Button>
          }
        />
      )}
      {!loading && !error && filtered.length > 0 && (
        <>
          <p className="text-xs text-ink-muted">
            Showing {filtered.length} of {data?.length ?? 0} cases
          </p>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((scenario, index) => (
              <ScenarioCard key={scenario.id} scenario={scenario} index={index} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
