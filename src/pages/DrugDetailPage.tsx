import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useParams } from 'react-router-dom'
import { AlertTriangle, MessageSquare, ShieldAlert, Stethoscope } from 'lucide-react'
import type { Drug } from '@/types'
import { Badge } from '@/components/ui/Badge'
import { ErrorState, LoadingState } from '@/components/common/States'
import { BackLink } from '@/components/simulation/SimulationTopBar'
import { useAsync } from '@/hooks/useAsync'
import { drugService } from '@/services'

interface SectionProps {
  title: string
  icon: typeof Stethoscope
  items: string[]
  tone?: 'default' | 'caution' | 'alert'
}

function DrugSection({ title, icon: Icon, items, tone = 'default' }: SectionProps) {
  if (items.length === 0) return null

  const shell =
    tone === 'alert'
      ? 'border-terracotta/40 bg-terracotta-100/50'
      : tone === 'caution'
        ? 'border-honey-600/35 bg-honey-100/60'
        : 'border-beige bg-cream-light'

  const iconColour =
    tone === 'alert' ? 'text-terracotta-600' : tone === 'caution' ? 'text-[#7A5C10]' : 'text-sage'

  return (
    <section className={`rounded-2xl border p-5 shadow-soft sm:p-6 ${shell}`}>
      <h2 className="inline-flex items-center gap-2 font-display text-[15px] text-forest">
        <Icon className={`h-4.5 w-4.5 ${iconColour}`} strokeWidth={1.9} />
        {title}
      </h2>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li key={item} className="text-sm leading-relaxed text-ink">
            {item}
          </li>
        ))}
      </ul>
    </section>
  )
}

/** A single drug entry: what it is, how to counsel on it, and what to watch. */
export function DrugDetailPage() {
  const { id = '' } = useParams()
  const { data: drug, loading, error, reload } = useAsync(() => drugService.get(id), [id])

  const [related, setRelated] = useState<Drug[]>([])
  useEffect(() => {
    if (!drug) return
    let active = true
    drugService
      .related(drug.id)
      .then((rows) => {
        if (active) setRelated(rows)
      })
      .catch(() => {
        if (active) setRelated([])
      })
    return () => {
      active = false
    }
  }, [drug])

  if (loading) return <LoadingState message="preparing" />
  if (error || !drug) {
    return (
      <ErrorState
        message={error ?? undefined}
        onRetry={reload}
        backTo={{ href: '/drugs', label: 'Back to drug knowledge' }}
      />
    )
  }

  return (
    <div className="space-y-6">
      <BackLink to="/drugs">Back to drug knowledge</BackLink>

      <header className="rounded-2xl border border-beige bg-cream-light p-5 shadow-soft sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="forest">{drug.drugClass}</Badge>
          {drug.genericFor && <Badge tone="neutral">Generic for {drug.genericFor}</Badge>}
        </div>
        <h1 className="mt-3 font-display text-2xl text-forest sm:text-[28px]">{drug.name}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted">{drug.summary}</p>

        <h2 className="mt-4 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
          Common uses
        </h2>
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {drug.commonUses.map((use) => (
            <li key={use} className="rounded-lg bg-cream px-2.5 py-1 text-[12px] text-ink">
              {use}
            </li>
          ))}
        </ul>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <DrugSection
          title="Counselling points"
          icon={MessageSquare}
          items={drug.counselingPoints}
        />
        <DrugSection
          title="Safety considerations"
          icon={ShieldAlert}
          items={drug.safetyConsiderations}
          tone="caution"
        />
        <DrugSection
          title="Interactions to watch"
          icon={AlertTriangle}
          items={drug.interactionsToWatch}
          tone="alert"
        />
        <DrugSection title="Adverse effects" icon={Stethoscope} items={drug.adverseEffects} />
      </div>

      {related.length > 0 && (
        <section className="rounded-2xl border border-beige bg-cream-light p-5 shadow-soft sm:p-6">
          <h2 className="font-display text-[15px] text-forest">Related entries</h2>
          <ul className="mt-3 grid gap-2 sm:grid-cols-3">
            {related.map((other) => (
              <li key={other.id}>
                <Link
                  to={`/drugs/${other.id}`}
                  className="block rounded-xl border border-beige bg-cream px-3.5 py-3 transition-colors hover:border-sage"
                >
                  <span className="block text-sm font-medium text-forest">{other.name}</span>
                  <span className="block text-[11px] text-ink-muted">{other.drugClass}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="rounded-xl border border-beige bg-cream px-3.5 py-3 text-[11px] leading-relaxed text-ink-muted">
        {drug.sourceNote} Educational reference only — not a substitute for the current SmPC or
        national formulary.
      </p>
    </div>
  )
}
