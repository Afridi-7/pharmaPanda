import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowRight, Clock, Eye, Target } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { DifficultyBadge, StatusBadge } from '@/components/common/ScenarioCard'
import { ErrorState, LoadingState } from '@/components/common/States'
import { BackLink } from '@/components/simulation/SimulationTopBar'
import { useAsync } from '@/hooks/useAsync'
import { attemptService, scenarioService } from '@/services'
import { ApiError } from '@/services/api'

export function SimulationDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { data: scenario, loading, error, reload } = useAsync(() => scenarioService.get(id), [id])
  const [starting, setStarting] = useState(false)
  const [startError, setStartError] = useState<string | null>(null)

  const enterPharmacy = async () => {
    setStarting(true)
    setStartError(null)
    try {
      const attempt = await attemptService.start(id)
      navigate(`/attempt/${attempt.id}`)
    } catch (err) {
      setStartError(err instanceof ApiError ? err.userMessage : 'We couldn’t open this case. Please try again.')
      setStarting(false)
    }
  }

  if (loading) return <LoadingState message="preparing" />
  if (error || !scenario) {
    return <ErrorState message={error ?? undefined} onRetry={reload} backTo={{ href: '/simulations', label: 'Back to Simulations' }} />
  }

  return (
    <div className="space-y-6">
      <BackLink to="/simulations">Back to simulations</BackLink>

      <header className="rounded-2xl border border-beige bg-cream-light p-5 shadow-soft sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="forest">{scenario.category}</Badge>
          <Badge tone="neutral">{scenario.setting}</Badge>
          <DifficultyBadge difficulty={scenario.difficulty} />
          <span className="inline-flex items-center gap-1.5 text-xs text-ink-muted">
            <Clock className="h-3.5 w-3.5" strokeWidth={1.9} />
            {scenario.durationMinutes[0]}–{scenario.durationMinutes[1]} minutes
          </span>
          <span className="ml-auto">
            <StatusBadge status={scenario.status} score={scenario.previousScore} />
          </span>
        </div>
        <h1 className="mt-3 font-display text-2xl text-forest sm:text-[28px]">{scenario.title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted">{scenario.description}</p>
      </header>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-2xl border border-beige bg-cream-light p-5 shadow-soft sm:p-6">
          <h2 className="inline-flex items-center gap-2 font-display text-lg text-forest">
            <Target className="h-4.5 w-4.5 text-sage" strokeWidth={1.9} />
            Mission
          </h2>
          <div className="mt-3 space-y-3 border-l-2 border-sage pl-4">
            {scenario.mission.split('\n').filter(Boolean).map((line) => (
              <p key={line} className="text-sm leading-relaxed text-ink">
                {line}
              </p>
            ))}
          </div>

          <h3 className="mt-6 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
            Educational objectives
          </h3>
          <ol className="mt-2.5 space-y-2">
            {scenario.objectives.map((objective, index) => (
              <li key={objective} className="flex gap-3 text-sm text-ink">
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-cream text-[11px] font-semibold text-forest">
                  {index + 1}
                </span>
                {objective}
              </li>
            ))}
          </ol>
        </section>

        <div className="space-y-4">
          <section className="rounded-2xl border border-beige bg-cream-light p-5 shadow-soft">
            <h2 className="font-display text-[15px] text-forest">Skills evaluated</h2>
            <ul className="mt-3 space-y-1.5">
              {scenario.skills.map((skill) => (
                <li key={skill} className="rounded-xl bg-cream px-3 py-2 text-sm text-ink">
                  {skill}
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border border-honey-600/35 bg-honey-100/60 p-5">
            <h2 className="inline-flex items-center gap-2 font-display text-[15px] text-forest">
              <Eye className="h-4 w-4 text-[#7A5C10]" strokeWidth={1.9} />
              Hidden information
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-ink">
              Only the patient's age and presenting complaint are shown at the start. Allergies, current
              medication and past conditions are revealed only when you ask about them.
            </p>
          </section>

          <section className="rounded-2xl border border-beige bg-cream-light p-5 shadow-soft">
            <p className="text-sm text-ink-muted">
              {scenario.status === 'completed'
                ? `Previous score: ${scenario.previousScore}. The consultation is not timed.`
                : 'The consultation is not timed.'}
            </p>
            <Button block className="mt-4" onClick={enterPharmacy} disabled={starting}>
              {starting ? 'Opening…' : 'Start consultation'}
              {!starting && <ArrowRight className="h-4 w-4" strokeWidth={2} />}
            </Button>
            {startError && (
              <p role="alert" className="mt-2 text-xs font-medium text-alert">
                {startError}
              </p>
            )}
            {scenario.lastAttemptId && (
              <Button
                variant="quiet"
                block
                className="mt-1.5"
                onClick={() => navigate(`/results/${scenario.lastAttemptId}`)}
              >
                View your previous results
              </Button>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
