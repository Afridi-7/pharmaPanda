import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CircleAlert,
  ListChecks,
  MessageSquare,
  Search,
  Stethoscope,
} from 'lucide-react'
import type { Evaluation, Scenario, TimelineStep } from '@/types'
import { Badge } from '@/components/ui/Badge'
import { buttonVariants } from '@/components/ui/Button'
import { ScoreRing } from '@/components/common/Score'
import { ErrorState, LoadingState } from '@/components/common/States'
import { BackLink } from '@/components/simulation/SimulationTopBar'
import { useAsync } from '@/hooks/useAsync'
import { evaluationService, scenarioService } from '@/services'
import { cn, formatDate, scoreBand } from '@/lib/utils'

/** Visual treatment per timeline step kind. Icon + label, never colour alone. */
const timelineKinds: Record<TimelineStep['kind'], { icon: typeof Search; tone: string }> = {
  'student-ask': { icon: Search, tone: 'bg-cream text-forest border-beige-dark' },
  'patient-reveal': { icon: MessageSquare, tone: 'bg-sage-100 text-forest border-sage/60' },
  'student-decision': { icon: Stethoscope, tone: 'bg-cream text-forest border-beige-dark' },
  'student-counsel': { icon: MessageSquare, tone: 'bg-cream text-forest border-beige-dark' },
  'system-detect': { icon: CircleAlert, tone: 'bg-terracotta-100 text-terracotta-600 border-terracotta/40' },
}

/**
 * Consultation report.
 *
 * Everything shown is produced by the evaluation engine — this page renders,
 * it does not score. Safety issues deliberately sit above the competency
 * breakdown: a critical finding is the most important thing on the page and
 * should not be reached by scrolling past charts.
 */
export function ResultsPage() {
  const { id = '' } = useParams()
  const {
    data: evaluation,
    loading,
    error,
    reload,
  } = useAsync(() => evaluationService.getByAttempt(id), [id])

  // The suggested next case is a nice-to-have: if the lookup fails the report
  // still renders in full, just without that card.
  const [nextScenario, setNextScenario] = useState<Scenario | null>(null)
  useEffect(() => {
    if (!evaluation?.nextScenarioId) return
    let active = true
    scenarioService
      .get(evaluation.nextScenarioId)
      .then((scenario) => {
        if (active) setNextScenario(scenario)
      })
      .catch(() => {
        if (active) setNextScenario(null)
      })
    return () => {
      active = false
    }
  }, [evaluation?.nextScenarioId])

  if (loading) return <LoadingState message="reviewing" />

  if (error || !evaluation) {
    return (
      <ErrorState
        message={error ?? undefined}
        onRetry={reload}
        backTo={{ href: '/simulations', label: 'Back to simulations' }}
      />
    )
  }

  const band = scoreBand(evaluation.totalScore)
  const critical = evaluation.safetyIssues.filter((issue) => issue.severity === 'critical')
  const warnings = evaluation.safetyIssues.filter((issue) => issue.severity !== 'critical')

  return (
    <div className="space-y-6">
      <BackLink to="/simulations">Back to simulations</BackLink>

      {/* --- Headline ---------------------------------------------------- */}
      <header className="rounded-2xl border border-beige bg-cream-light p-5 shadow-soft sm:p-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <ScoreRing score={evaluation.totalScore} size={128} showBand={false} className="shrink-0" />

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="neutral">{evaluation.scenarioTitle}</Badge>
              <Badge tone={band.tone === 'attention' ? 'terracotta' : band.tone === 'developing' ? 'honey' : 'sage'}>
                {band.label}
              </Badge>
              <span className="text-xs text-ink-muted">{formatDate(evaluation.createdAt)}</span>
            </div>
            <h1 className="mt-2.5 font-display text-2xl text-forest sm:text-[28px]">
              {evaluation.headline}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted">
              {evaluation.pandaMessage}
            </p>
          </div>
        </div>
      </header>

      {/* --- Safety issues, before anything else -------------------------- */}
      {evaluation.safetyIssues.length > 0 && (
        <section
          aria-labelledby="safety-heading"
          className={cn(
            'rounded-2xl border p-5 sm:p-6',
            critical.length > 0
              ? 'border-terracotta/45 bg-terracotta-100/60'
              : 'border-honey-600/40 bg-honey-100/60',
          )}
        >
          <h2
            id="safety-heading"
            className="inline-flex items-center gap-2 font-display text-lg text-forest"
          >
            <AlertTriangle
              className={cn('h-5 w-5', critical.length > 0 ? 'text-terracotta-600' : 'text-[#7A5C10]')}
              strokeWidth={1.9}
            />
            {critical.length > 0 ? 'Safety issue' : 'Points to review'}
            <span className="sr-only">
              {critical.length > 0 ? ' — critical severity' : ' — warning severity'}
            </span>
          </h2>

          <ul className="mt-4 space-y-4">
            {[...critical, ...warnings].map((issue) => (
              <li key={issue.id} className="rounded-xl border border-beige bg-cream-light p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={issue.severity === 'critical' ? 'terracotta' : 'honey'}>
                    {issue.severity === 'critical' ? 'Critical' : 'Warning'}
                  </Badge>
                  <h3 className="font-display text-[15px] text-forest">{issue.title}</h3>
                </div>
                <dl className="mt-3 space-y-2.5">
                  <div>
                    <dt className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
                      What happened
                    </dt>
                    <dd className="mt-0.5 text-sm leading-relaxed text-ink">{issue.what}</dd>
                  </div>
                  <div>
                    <dt className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
                      Why it matters
                    </dt>
                    <dd className="mt-0.5 text-sm leading-relaxed text-ink">{issue.why}</dd>
                  </div>
                </dl>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* --- Competency breakdown ----------------------------------------- */}
      <section
        aria-labelledby="competency-heading"
        className="rounded-2xl border border-beige bg-cream-light p-5 shadow-soft sm:p-6"
      >
        <h2 id="competency-heading" className="font-display text-lg text-forest">
          Competency breakdown
        </h2>
        <p className="mt-1 text-sm text-ink-muted">
          Scored from the consultation: what you asked, in what order, and what you did with the answers.
        </p>

        <ul className="mt-4 space-y-3">
          {evaluation.scores.map((entry) => {
            const entryBand = scoreBand(entry.score)
            return (
              <li key={entry.key} className="flex items-center gap-3">
                <span className="w-[136px] shrink-0 truncate text-sm text-ink">{entry.label}</span>
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-beige" aria-hidden>
                  <span
                    className={cn(
                      'block h-full rounded-full transition-[width] duration-700',
                      entryBand.tone === 'strong' && 'bg-moss',
                      entryBand.tone === 'solid' && 'bg-sage',
                      entryBand.tone === 'developing' && 'bg-honey',
                      entryBand.tone === 'attention' && 'bg-terracotta',
                    )}
                    style={{ width: `${Math.max(0, Math.min(100, entry.score))}%` }}
                  />
                </span>
                {/* Score and band as text, so status never depends on colour. */}
                <span className="w-[112px] shrink-0 text-right text-xs text-ink-muted">
                  <span className="font-medium text-forest">{entry.score}%</span> {entryBand.label}
                </span>
              </li>
            )
          })}
        </ul>
      </section>

      {/* --- Strengths and gaps ------------------------------------------- */}
      <div className="grid gap-4 lg:grid-cols-2">
        <section
          aria-labelledby="strengths-heading"
          className="rounded-2xl border border-beige bg-cream-light p-5 shadow-soft sm:p-6"
        >
          <h2
            id="strengths-heading"
            className="inline-flex items-center gap-2 font-display text-lg text-forest"
          >
            <Check className="h-4.5 w-4.5 text-moss" strokeWidth={2.2} />
            What went well
          </h2>
          {evaluation.strengths.length === 0 ? (
            <p className="mt-3 text-sm text-ink-muted">
              Nothing was recorded here. The sections below show where to start.
            </p>
          ) : (
            <ul className="mt-3 space-y-3">
              {evaluation.strengths.map((item) => (
                <li key={item.id} className="rounded-xl border border-sage/50 bg-sage-100/50 px-3.5 py-3">
                  <h3 className="text-sm font-medium text-forest">{item.title}</h3>
                  <p className="mt-1 text-[13px] leading-relaxed text-ink">{item.detail}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section
          aria-labelledby="missed-heading"
          className="rounded-2xl border border-beige bg-cream-light p-5 shadow-soft sm:p-6"
        >
          <h2
            id="missed-heading"
            className="inline-flex items-center gap-2 font-display text-lg text-forest"
          >
            <ListChecks className="h-4.5 w-4.5 text-sage" strokeWidth={1.9} />
            What to work on
          </h2>
          {evaluation.missed.length === 0 ? (
            <p className="mt-3 text-sm text-ink-muted">Nothing significant was missed in this consultation.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {evaluation.missed.map((item) => (
                <li key={item.id} className="rounded-xl border border-beige bg-cream px-3.5 py-3">
                  <h3 className="text-sm font-medium text-forest">{item.title}</h3>
                  <p className="mt-1 text-[13px] leading-relaxed text-ink-muted">{item.detail}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* --- Reasoning timeline ------------------------------------------- */}
      {evaluation.timeline.length > 0 && (
        <section
          aria-labelledby="timeline-heading"
          className="rounded-2xl border border-beige bg-cream-light p-5 shadow-soft sm:p-6"
        >
          <h2 id="timeline-heading" className="font-display text-lg text-forest">
            How the consultation ran
          </h2>
          <p className="mt-1 text-sm text-ink-muted">
            Each question you asked, what it uncovered, and where the decision was made.
          </p>

          <ol className="mt-4 space-y-0">
            {evaluation.timeline.map((step, index) => {
              const kind = timelineKinds[step.kind]
              const last = index === evaluation.timeline.length - 1
              return (
                <li key={step.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span
                      className={cn(
                        'grid h-7 w-7 shrink-0 place-items-center rounded-full border',
                        kind.tone,
                      )}
                      aria-hidden
                    >
                      <kind.icon className="h-3.5 w-3.5" strokeWidth={2} />
                    </span>
                    {!last && <span className="w-px flex-1 bg-beige" aria-hidden />}
                  </div>
                  <div className={cn('min-w-0 flex-1', last ? 'pb-0' : 'pb-4')}>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-muted">
                      {step.label}
                    </p>
                    <p className="mt-0.5 break-words text-sm leading-relaxed text-ink">{step.detail}</p>
                  </div>
                </li>
              )
            })}
          </ol>
        </section>
      )}

      {/* --- Model approach ------------------------------------------------ */}
      {evaluation.betterApproach.length > 0 && (
        <section
          aria-labelledby="approach-heading"
          className="rounded-2xl border border-beige bg-cream-light p-5 shadow-soft sm:p-6"
        >
          <h2 id="approach-heading" className="font-display text-lg text-forest">
            A stronger sequence
          </h2>
          <p className="mt-1 text-sm text-ink-muted">
            How a careful consultation would have been structured for this case.
          </p>
          <ol className="mt-4 space-y-2">
            {evaluation.betterApproach.map((step, index) => (
              <li key={step} className="flex gap-3 text-sm text-ink">
                <span className="grid h-5.5 w-5.5 shrink-0 place-items-center rounded-full bg-cream text-[11px] font-semibold text-forest">
                  {index + 1}
                </span>
                <span className="leading-relaxed">{step}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* --- Next case ------------------------------------------------------ */}
      <section className="rounded-2xl border border-sage/60 bg-sage-100/60 p-5 shadow-soft sm:p-6">
        <h2 className="font-display text-lg text-forest">Recommended next</h2>
        <p className="mt-1 text-sm leading-relaxed text-ink">{evaluation.nextScenarioReason}</p>

        {nextScenario && (
          <div className="mt-4 rounded-xl border border-sage/70 bg-cream-light p-4">
            <h3 className="font-display text-[17px] text-forest">{nextScenario.title}</h3>
            <p className="mt-1.5 text-sm text-ink-muted">{nextScenario.tagline}</p>
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            to={`/simulations/${evaluation.nextScenarioId}`}
            className={cn(buttonVariants({ variant: 'moss' }))}
          >
            Open next case
            <ArrowRight className="h-4 w-4" strokeWidth={2} />
          </Link>
          <Link
            to={`/simulations/${evaluation.scenarioId}`}
            className={cn(buttonVariants({ variant: 'secondary' }))}
          >
            Repeat this case
          </Link>
        </div>
      </section>
    </div>
  )
}
