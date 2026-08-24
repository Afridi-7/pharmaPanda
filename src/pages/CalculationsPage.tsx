import { Link } from 'react-router-dom'
import { ArrowRight, Calculator } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { CardSkeletonGrid, ErrorState, PageHeader } from '@/components/common/States'
import { useAsync } from '@/hooks/useAsync'
import { calculationService } from '@/services'

/**
 * Calculation topics.
 *
 * Problems are still served from the local dataset; the service boundary is
 * unchanged, so moving them behind the API later will not touch this page.
 */
export function CalculationsPage() {
  const { data, loading, error, reload } = useAsync(() => calculationService.topics(), [])

  if (loading) return <CardSkeletonGrid count={6} />
  if (error || !data) return <ErrorState message={error ?? undefined} onRetry={reload} />

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pharmacy Calculations"
        subtitle="Dosing, concentration, dilution and infusion rates, each with a worked solution."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {data.map((topic) => (
          <article
            key={topic.topic}
            className="flex flex-col rounded-2xl border border-beige bg-cream-light p-5 shadow-soft"
          >
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-sage-100 text-forest">
              <Calculator className="h-5 w-5" strokeWidth={1.9} />
            </span>

            <h2 className="mt-3.5 font-display text-[17px] text-forest">{topic.topic}</h2>
            <p className="mt-1.5 flex-1 text-sm leading-relaxed text-ink-muted">{topic.blurb}</p>

            <ul className="mt-3 flex flex-wrap gap-1.5">
              {topic.skills.map((skill) => (
                <li key={skill}>
                  <Badge tone="neutral">{skill}</Badge>
                </li>
              ))}
            </ul>

            <div className="mt-4 flex items-center justify-between border-t border-beige pt-3">
              <span className="text-xs text-ink-muted">
                {topic.problemCount} {topic.problemCount === 1 ? 'problem' : 'problems'}
              </span>
              <Link
                to={`/calculations/${encodeURIComponent(topic.topic)}`}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-moss-600 hover:underline"
              >
                Start
                <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
