import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Award, Flame, Target } from 'lucide-react'
import type { Achievement, Competency } from '@/types'
import { Badge, Progress } from '@/components/ui/Badge'
import { buttonVariants } from '@/components/ui/Button'
import { StatCard } from '@/components/common/Score'
import { CompetencyBars, CompetencyRadar, TrendLine } from '@/components/common/Charts'
import { CardSkeletonGrid, EmptyState, ErrorState, PageHeader } from '@/components/common/States'
import { useAsync } from '@/hooks/useAsync'
import { progressService } from '@/services'
import { cn, scoreBand } from '@/lib/utils'

/** Achievement icons, mapped from the API's icon key. */
const achievementIcon: Record<Achievement['icon'], typeof Award> = {
  stethoscope: Target,
  shield: Award,
  brain: Target,
  messages: Award,
  flame: Flame,
  sparkles: Award,
}

function CompetencyDetail({ competency }: { competency: Competency }) {
  const band = scoreBand(competency.score)
  const untouched = competency.attempts === 0

  return (
    <article className="rounded-2xl border border-beige bg-cream-light p-5 shadow-soft">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-display text-[17px] text-forest">{competency.label}</h3>
        <span className="text-sm text-ink-muted">
          {untouched ? (
            'Not yet assessed'
          ) : (
            <>
              <span className="font-medium text-forest">{competency.score}%</span> {band.label}
            </>
          )}
        </span>
      </div>

      <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{competency.description}</p>

      <Progress
        value={competency.score}
        size="sm"
        label={competency.label}
        className="mt-3"
      />

      <p className="mt-2 text-[11px] text-ink-muted">
        {untouched
          ? 'Complete a consultation to start tracking this.'
          : `${competency.trendLabel} · ${competency.attempts} ${
              competency.attempts === 1 ? 'consultation' : 'consultations'
            }`}
      </p>

      {/* A single data point has no trend to draw. */}
      {competency.history.length > 1 && (
        <div className="mt-3">
          <TrendLine history={competency.history} />
        </div>
      )}

      <div className="mt-3 border-t border-beige pt-3">
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
          Focus areas
        </p>
        <ul className="mt-2 space-y-1.5">
          {competency.focusAreas.map((area) => (
            <li key={area} className="text-[13px] leading-relaxed text-ink">
              {area}
            </li>
          ))}
        </ul>
      </div>
    </article>
  )
}

function AchievementCard({ achievement }: { achievement: Achievement }) {
  const Icon = achievementIcon[achievement.icon] ?? Award
  const { progress } = achievement

  return (
    <article
      className={cn(
        'rounded-2xl border p-4',
        achievement.unlocked
          ? 'border-sage/60 bg-sage-100/60'
          : 'border-beige bg-cream-light',
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            'grid h-9 w-9 shrink-0 place-items-center rounded-xl',
            achievement.unlocked ? 'bg-forest text-cream-light' : 'bg-cream text-ink-muted',
          )}
          aria-hidden
        >
          <Icon className="h-4.5 w-4.5" strokeWidth={1.9} />
        </span>
        <div className="min-w-0">
          <h3 className="text-sm font-medium text-forest">
            {achievement.title}
            {/* State as text, never colour alone. */}
            <span className="sr-only">{achievement.unlocked ? ' — unlocked' : ' — locked'}</span>
          </h3>
          <p className="mt-0.5 text-[13px] leading-relaxed text-ink-muted">
            {achievement.description}
          </p>
        </div>
        {achievement.unlocked && (
          <Badge tone="sage" className="ml-auto shrink-0">
            Unlocked
          </Badge>
        )}
      </div>

      {!achievement.unlocked && progress && (
        <div className="mt-3">
          <Progress
            value={(progress.current / progress.target) * 100}
            size="sm"
            label={`${achievement.title} progress`}
          />
          <p className="mt-1 text-[11px] text-ink-muted">
            {progress.current} of {progress.target}
          </p>
        </div>
      )}
    </article>
  )
}

/**
 * Competency progress and achievements.
 *
 * Everything here is computed server-side from stored evaluations — this page
 * renders, it does not score.
 */
export function ProgressPage() {
  const { data, loading, error, reload } = useAsync(() => progressService.snapshot(), [])
  const [tab, setTab] = useState<'competencies' | 'achievements'>('competencies')

  if (loading) return <CardSkeletonGrid count={3} />
  if (error || !data) return <ErrorState message={error ?? undefined} onRetry={reload} />

  const assessed = data.competencies.filter((c) => c.attempts > 0)
  const hasData = assessed.length > 0
  const unlocked = data.achievements.filter((a) => a.unlocked).length

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Progress"
        subtitle="How your six competencies are tracking across every consultation."
      />

      {!hasData ? (
        <EmptyState
          title="No consultations assessed yet"
          description="Competency scores appear here once you finish and submit your first case."
          action={
            <Link to="/simulations" className={cn(buttonVariants({ variant: 'primary', size: 'sm' }))}>
              Browse simulations
            </Link>
          }
        />
      ) : (
        <>
          <section aria-label="Summary" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Overall Score" value={data.overallScore} />
            <StatCard
              label="Consultations"
              value={data.consultationsCompleted}
              suffix=""
            />
            <StatCard label="Day Streak" value={data.streakDays} suffix="" />
            <StatCard label="Achievements" value={unlocked} suffix={`/${data.achievements.length}`} />
          </section>

          <section className="rounded-2xl border border-beige bg-cream-light p-5 shadow-soft sm:p-6">
            <h2 className="font-display text-lg text-forest">Competency profile</h2>
            <div className="grid gap-4 lg:grid-cols-2">
              <CompetencyRadar competencies={data.competencies} />
              <CompetencyBars competencies={data.competencies} />
            </div>
            {/* Charts are aria-hidden, so the same values are listed as text. */}
            <ul className="mt-2 space-y-2">
              {data.competencies.map((competency) => {
                const band = scoreBand(competency.score)
                return (
                  <li
                    key={competency.key}
                    className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3"
                  >
                    <span className="truncate text-xs text-ink sm:w-[136px] sm:shrink-0">
                      {competency.label}
                    </span>
                    <Progress
                      value={competency.score}
                      size="sm"
                      label={competency.label}
                      className="flex-1"
                    />
                    <span className="text-xs text-ink-muted sm:w-[104px] sm:shrink-0 sm:text-right">
                      <span className="font-medium text-forest">{competency.score}%</span>{' '}
                      {competency.attempts > 0 ? band.label : 'n/a'}
                    </span>
                  </li>
                )
              })}
            </ul>
          </section>
        </>
      )}

      <div className="flex gap-2 border-b border-beige">
        {(
          [
            ['competencies', 'Competencies'],
            ['achievements', `Achievements (${unlocked}/${data.achievements.length})`],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            aria-current={tab === value ? 'true' : undefined}
            className={cn(
              '-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors',
              tab === value
                ? 'border-forest text-forest'
                : 'border-transparent text-ink-muted hover:text-forest',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'competencies' ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {data.competencies.map((competency) => (
            <CompetencyDetail key={competency.key} competency={competency} />
          ))}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {data.achievements.map((achievement) => (
            <AchievementCard key={achievement.id} achievement={achievement} />
          ))}
        </div>
      )}
    </div>
  )
}
