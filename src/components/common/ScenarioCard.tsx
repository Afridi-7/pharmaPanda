import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, CheckCircle2, Clock, PlayCircle } from 'lucide-react'
import type { AttemptSummary, Scenario } from '@/types'
import { Badge } from '@/components/ui/Badge'
import { buttonVariants } from '@/components/ui/Button'
import { cn, relativeDay, scoreBand } from '@/lib/utils'

const difficultyTone = {
  Beginner: 'sage',
  Intermediate: 'honey',
  Advanced: 'terracotta',
} as const

export function DifficultyBadge({ difficulty }: { difficulty: Scenario['difficulty'] }) {
  return <Badge tone={difficultyTone[difficulty]}>{difficulty}</Badge>
}

export function StatusBadge({ status, score }: { status: Scenario['status']; score?: number }) {
  if (status === 'completed') {
    return (
      <Badge tone="sage">
        <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2} />
        Completed{score !== undefined ? ` · ${score}` : ''}
      </Badge>
    )
  }
  if (status === 'in-progress') {
    return (
      <Badge tone="honey">
        <PlayCircle className="h-3.5 w-3.5" strokeWidth={2} />
        In progress
      </Badge>
    )
  }
  return <Badge tone="outline">Not started</Badge>
}

export function ScenarioCard({ scenario, index = 0 }: { scenario: Scenario; index?: number }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: Math.min(index * 0.04, 0.3) }}
      className="group flex flex-col rounded-2xl border border-beige bg-cream-light p-5 shadow-soft transition-colors hover:border-sage"
    >
      <div className="flex items-start justify-between gap-3">
        <Badge tone="forest">{scenario.category}</Badge>
        <StatusBadge status={scenario.status} score={scenario.previousScore} />
      </div>
      <h3 className="mt-3 font-display text-[17px] leading-snug text-forest">
        <Link to={`/simulations/${scenario.id}`} className="hover:underline">
          {scenario.title}
        </Link>
      </h3>
      <p className="mt-1.5 flex-1 text-sm leading-relaxed text-ink-muted">{scenario.description}</p>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <DifficultyBadge difficulty={scenario.difficulty} />
        <span className="inline-flex items-center gap-1.5 text-xs text-ink-muted">
          <Clock className="h-3.5 w-3.5" strokeWidth={1.9} />
          {scenario.durationMinutes[0]}–{scenario.durationMinutes[1]} minutes
        </span>
      </div>
      <ul className="mt-3 flex flex-wrap gap-1.5">
        {scenario.skills.slice(0, 3).map((skill) => (
          <li key={skill} className="rounded-lg bg-cream px-2 py-0.5 text-[11px] text-ink-muted">
            {skill}
          </li>
        ))}
      </ul>
      <Link
        to={`/simulations/${scenario.id}`}
        className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }), 'mt-5 justify-between')}
      >
        {scenario.status === 'in-progress' ? 'Continue case' : scenario.status === 'completed' ? 'Review case' : 'View case'}
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" strokeWidth={1.9} />
      </Link>
    </motion.article>
  )
}

const attemptStatusTone = {
  Completed: 'sage',
  'Needs review': 'honey',
  Abandoned: 'neutral',
} as const

export function AttemptTable({ attempts, caption }: { attempts: AttemptSummary[]; caption?: string }) {
  return (
    <>
      {/*
        Mobile: a 620px table forces horizontal scrolling on a phone, which
        hides the score and status columns entirely. Cards show the same
        fields stacked, so nothing needs sideways swiping.
      */}
      <ul className="space-y-2.5 sm:hidden">
        {attempts.map((attempt) => {
          const band = scoreBand(attempt.score)
          return (
            <li key={attempt.attemptId}>
              <Link
                to={`/results/${attempt.attemptId}`}
                className="block rounded-xl border border-beige bg-cream px-3.5 py-3 transition-colors hover:border-sage"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="min-w-0 flex-1 text-sm font-medium leading-snug text-forest">
                    {attempt.scenarioTitle}
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="font-display text-lg leading-none text-forest">
                      {attempt.score}
                    </span>
                    <span className="mt-0.5 block text-[10px] text-ink-muted">{band.label}</span>
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-ink-muted">
                  <Badge tone={attemptStatusTone[attempt.status]}>{attempt.status}</Badge>
                  <span>{attempt.category}</span>
                  <span aria-hidden>·</span>
                  <span>{relativeDay(attempt.date)}</span>
                  <span aria-hidden>·</span>
                  <span>{attempt.durationLabel}</span>
                </div>
              </Link>
            </li>
          )
        })}
      </ul>

    <div className="hidden overflow-x-auto scroll-slim sm:block">
      <table className="w-full min-w-[620px] border-collapse text-sm">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr className="border-b border-beige text-left text-[11px] uppercase tracking-[0.1em] text-ink-muted">
            <th scope="col" className="py-2.5 pr-4 font-semibold">Simulation</th>
            <th scope="col" className="py-2.5 pr-4 font-semibold">Category</th>
            <th scope="col" className="py-2.5 pr-4 font-semibold">Score</th>
            <th scope="col" className="py-2.5 pr-4 font-semibold">Date</th>
            <th scope="col" className="py-2.5 pr-4 font-semibold">Duration</th>
            <th scope="col" className="py-2.5 pr-4 font-semibold">Status</th>
            <th scope="col" className="py-2.5 font-semibold"><span className="sr-only">Open</span></th>
          </tr>
        </thead>
        <tbody>
          {attempts.map((attempt) => {
            const band = scoreBand(attempt.score)
            return (
              <tr key={attempt.attemptId} className="border-b border-beige/70 transition-colors hover:bg-cream">
                <td className="py-3 pr-4">
                  <Link to={`/results/${attempt.attemptId}`} className="font-medium text-forest hover:underline">
                    {attempt.scenarioTitle}
                  </Link>
                </td>
                <td className="py-3 pr-4 text-ink-muted">{attempt.category}</td>
                <td className="py-3 pr-4">
                  <span className="font-medium text-forest">{attempt.score}</span>
                  <span className="ml-1.5 text-[11px] text-ink-muted">{band.label}</span>
                </td>
                <td className="py-3 pr-4 text-ink-muted">{relativeDay(attempt.date)}</td>
                <td className="py-3 pr-4 text-ink-muted">{attempt.durationLabel}</td>
                <td className="py-3 pr-4">
                  <Badge tone={attemptStatusTone[attempt.status]}>{attempt.status}</Badge>
                </td>
                <td className="py-3 text-right">
                  <Link to={`/results/${attempt.attemptId}`} className="text-xs font-medium text-moss-600 hover:underline">
                    View results
                  </Link>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
    </>
  )
}
