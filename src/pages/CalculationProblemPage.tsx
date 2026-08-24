import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AlertTriangle, ArrowRight, Check, Lightbulb, X } from 'lucide-react'
import type { CalculationProblem, CalculationTopic } from '@/types'
import { Badge, Progress } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Field'
import { ErrorState, LoadingState } from '@/components/common/States'
import { BackLink } from '@/components/simulation/SimulationTopBar'
import { calculationService } from '@/services'
import type { CalculationCheck } from '@/services/calculationService'
import { ApiError } from '@/services/api'
import { cn } from '@/lib/utils'

/**
 * Calculation practice.
 *
 * Marking is a service call rather than a client-side comparison, so the
 * expected answer stays behind the boundary and the page never has to hold it.
 */
export function CalculationProblemPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()

  const [problems, setProblems] = useState<CalculationProblem[]>([])
  const [index, setIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [answer, setAnswer] = useState('')
  const [result, setResult] = useState<CalculationCheck | null>(null)
  const [checking, setChecking] = useState(false)
  const [inputError, setInputError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      // The route param is a topic name; a single-problem deep link resolves
      // to that problem on its own.
      const byTopic = await calculationService
        .byTopic(decodeURIComponent(id) as CalculationTopic)
        .catch(() => [])

      if (byTopic.length > 0) {
        setProblems(byTopic)
      } else {
        setProblems([await calculationService.get(id)])
      }
      setIndex(0)
    } catch (error) {
      setLoadError(
        error instanceof ApiError ? error.userMessage : 'We couldn’t open that calculation.',
      )
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    void load()
  }, [load])

  const problem = problems[index]

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!problem || checking) return

    const parsed = Number(answer.replace(',', '.').trim())
    if (!answer.trim() || Number.isNaN(parsed)) {
      setInputError('Enter your answer as a number.')
      return
    }

    setInputError(null)
    setChecking(true)
    try {
      setResult(await calculationService.check(problem.id, parsed))
    } catch (error) {
      setInputError(
        error instanceof ApiError ? error.userMessage : 'We couldn’t mark that. Please try again.',
      )
    } finally {
      setChecking(false)
    }
  }

  const advance = () => {
    setResult(null)
    setAnswer('')
    setInputError(null)
    if (index + 1 < problems.length) {
      setIndex(index + 1)
    } else {
      navigate('/calculations')
    }
  }

  const retry = () => {
    setResult(null)
    setAnswer('')
    setInputError(null)
  }

  if (loading) return <LoadingState message="preparing" />
  if (loadError || !problem) {
    return (
      <ErrorState
        message={loadError ?? undefined}
        onRetry={load}
        backTo={{ href: '/calculations', label: 'Back to calculations' }}
      />
    )
  }

  const last = index + 1 >= problems.length

  return (
    <div className="space-y-6">
      <BackLink to="/calculations">Back to calculations</BackLink>

      <header className="rounded-2xl border border-beige bg-cream-light p-5 shadow-soft sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="forest">{problem.topic}</Badge>
          <Badge tone="neutral">{problem.difficulty}</Badge>
          {problems.length > 1 && (
            <span className="ml-auto text-xs text-ink-muted">
              Problem {index + 1} of {problems.length}
            </span>
          )}
        </div>

        <h1 className="mt-3 font-display text-2xl text-forest">{problem.title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">{problem.prompt}</p>

        {problems.length > 1 && (
          <Progress
            value={((index + (result ? 1 : 0)) / problems.length) * 100}
            size="sm"
            label="Progress through this topic"
            className="mt-4"
          />
        )}
      </header>

      <div className="grid gap-4 lg:grid-cols-[1fr_0.85fr]">
        <section className="rounded-2xl border border-beige bg-cream-light p-5 shadow-soft sm:p-6">
          <h2 className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
            The prescription
          </h2>
          <dl className="mt-3 space-y-2">
            {problem.givens.map((given) => (
              <div
                key={given.label}
                className="flex items-baseline justify-between gap-3 rounded-xl bg-cream px-3.5 py-2.5"
              >
                <dt className="text-[13px] text-ink-muted">{given.label}</dt>
                <dd className="text-sm font-medium text-forest">{given.value}</dd>
              </div>
            ))}
          </dl>

          <h2 className="mt-5 font-display text-[17px] text-forest">{problem.question}</h2>

          <form onSubmit={submit} className="mt-4" noValidate>
            <div className="flex items-end gap-2">
              <Input
                label="Your answer"
                value={answer}
                onChange={(event) => setAnswer(event.target.value)}
                onKeyDown={() => setInputError(null)}
                inputMode="decimal"
                autoComplete="off"
                placeholder="0"
                disabled={Boolean(result)}
                error={inputError ?? undefined}
                className="flex-1"
              />
              <span className="pb-2.5 text-sm text-ink-muted">{problem.unit}</span>
            </div>

            {!result && (
              <Button type="submit" className="mt-3" disabled={checking}>
                {checking ? 'Checking…' : 'Check answer'}
              </Button>
            )}
          </form>
        </section>

        <section
          className={cn(
            'rounded-2xl border p-5 shadow-soft sm:p-6',
            !result && 'border-beige bg-cream-light',
            result?.correct && 'border-sage/60 bg-sage-100/60',
            result && !result.correct && 'border-terracotta/40 bg-terracotta-100/50',
          )}
          aria-live="polite"
        >
          {!result ? (
            <>
              <h2 className="inline-flex items-center gap-2 font-display text-[15px] text-forest">
                <Lightbulb className="h-4 w-4 text-sage" strokeWidth={1.9} />
                Before you answer
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                Write the units at each step. Most errors here are a factor of ten, not a
                misunderstanding of the method.
              </p>
            </>
          ) : (
            <>
              <h2 className="inline-flex items-center gap-2 font-display text-lg text-forest">
                <span
                  className={cn(
                    'grid h-6 w-6 place-items-center rounded-full',
                    result.correct ? 'bg-moss text-cream-light' : 'bg-terracotta text-cream-light',
                  )}
                  aria-hidden
                >
                  {result.correct ? (
                    <Check className="h-3.5 w-3.5" strokeWidth={3} />
                  ) : (
                    <X className="h-3.5 w-3.5" strokeWidth={3} />
                  )}
                </span>
                {/* Outcome as words, never colour alone. */}
                {result.correct ? 'Correct' : 'Not quite'}
              </h2>

              <p className="mt-2 text-sm text-ink">
                You answered <span className="font-medium">{result.submitted}</span> {result.unit}.
                {!result.correct && (
                  <>
                    {' '}
                    The answer is{' '}
                    <span className="font-medium text-forest">{result.answer}</span> {result.unit}.
                  </>
                )}
              </p>

              {result.factorOfTen && (
                <p className="mt-3 inline-flex items-start gap-2 rounded-xl border border-terracotta/40 bg-cream-light px-3 py-2 text-[13px] text-terracotta-600">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.9} />
                  <span>
                    You are out by a factor of ten. In practice this is the error that reaches a
                    patient — check the decimal place before you dispense.
                  </span>
                </p>
              )}

              <h3 className="mt-5 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
                Working
              </h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-muted">
                {result.explanationIntro}
              </p>
              <ol className="mt-3 space-y-2.5">
                {result.steps.map((step, stepIndex) => (
                  <li key={step.title} className="flex gap-3">
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-cream text-[11px] font-semibold text-forest">
                      {stepIndex + 1}
                    </span>
                    <span>
                      <span className="block text-sm font-medium text-forest">{step.title}</span>
                      <span className="block text-[13px] leading-relaxed text-ink">{step.detail}</span>
                    </span>
                  </li>
                ))}
              </ol>

              <p className="mt-4 rounded-xl border border-honey-600/35 bg-honey-100/60 px-3.5 py-3 text-[13px] leading-relaxed text-ink">
                <span className="font-medium">Common pitfall: </span>
                {result.pitfall}
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <Button onClick={advance}>
                  {last ? 'Finish topic' : 'Next problem'}
                  <ArrowRight className="h-4 w-4" strokeWidth={2} />
                </Button>
                {!result.correct && (
                  <Button variant="secondary" onClick={retry}>
                    Try again
                  </Button>
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  )
}
