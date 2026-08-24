import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Clock, Play } from 'lucide-react'
import { Badge, Progress } from '@/components/ui/Badge'
import { Button, buttonVariants } from '@/components/ui/Button'
import { StatCard } from '@/components/common/Score'
import { ActivityBars, CompetencyRadar } from '@/components/common/Charts'
import { AttemptTable, DifficultyBadge } from '@/components/common/ScenarioCard'
import { CardSkeletonGrid, ErrorState, PageHeader } from '@/components/common/States'
import { useAsync } from '@/hooks/useAsync'
import { useAuth } from '@/hooks/useAuth'
import { dashboardService } from '@/services'
import { cn, scoreBand } from '@/lib/utils'

export function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { data, loading, error, reload } = useAsync(() => dashboardService.snapshot(), [])

  if (loading) return <CardSkeletonGrid count={3} />
  if (error || !data) return <ErrorState message={error ?? undefined} onRetry={reload} />

  const { continueScenario, recommendedScenario } = data

  return (
    <div className="space-y-7">
      <PageHeader
        title={user?.firstName ? `${data.greeting}, ${user.firstName}` : data.greeting}
        subtitle="Pick up where you left off, or start a new case."
        actions={
          <Button onClick={() => navigate(`/simulations/${continueScenario.id}`)}>
            <Play className="h-4 w-4" strokeWidth={2} />
            Start Simulation
          </Button>
        }
      />

      <section aria-label="Your current scores" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {data.metrics.map((metric) => (
          <StatCard key={metric.label} label={metric.label} value={metric.value} />
        ))}
      </section>

      <div className="grid gap-4 lg:grid-cols-[1.25fr_1fr]">
        <article className="flex flex-col rounded-2xl border border-beige bg-cream-light p-5 shadow-soft sm:p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted">Continue training</p>
          <h2 className="mt-2 font-display text-xl text-forest">{continueScenario.title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">{continueScenario.description}</p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Badge tone="forest">{continueScenario.setting}</Badge>
            <DifficultyBadge difficulty={continueScenario.difficulty} />
            <span className="inline-flex items-center gap-1.5 text-xs text-ink-muted">
              <Clock className="h-3.5 w-3.5" strokeWidth={1.9} />
              {continueScenario.durationMinutes[0]}–{continueScenario.durationMinutes[1]} minutes
            </span>
          </div>
          <div className="mt-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-muted">Skills</p>
            <ul className="mt-1.5 flex flex-wrap gap-1.5">
              {continueScenario.skills.map((skill) => (
                <li key={skill} className="rounded-lg bg-cream px-2 py-0.5 text-[11px] text-ink-muted">
                  {skill}
                </li>
              ))}
            </ul>
          </div>
          <Link
            to={`/simulations/${continueScenario.id}`}
            className={cn(buttonVariants({ variant: 'primary' }), 'mt-6 self-start')}
          >
            Continue Simulation
            <ArrowRight className="h-4 w-4" strokeWidth={2} />
          </Link>
        </article>

        <article className="flex flex-col rounded-2xl border border-sage/60 bg-sage-100/60 p-5 shadow-soft sm:p-6">
          <div>
            <h2 className="font-display text-lg text-forest">Recommended next</h2>
            <p className="mt-1 text-sm leading-relaxed text-ink">{data.recommendationReason}</p>
          </div>
          <div className="mt-4 rounded-xl border border-sage/70 bg-cream-light p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-muted">Suggested case</p>
            <h3 className="mt-1 font-display text-[17px] text-forest">{recommendedScenario.title}</h3>
            <p className="mt-1.5 text-sm text-ink-muted">{recommendedScenario.tagline}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge tone="neutral">{recommendedScenario.category}</Badge>
              <DifficultyBadge difficulty={recommendedScenario.difficulty} />
            </div>
          </div>
          <Link
            to={`/simulations/${recommendedScenario.id}`}
            className={cn(buttonVariants({ variant: 'moss' }), 'mt-4 self-start')}
          >
            Open this case
          </Link>
        </article>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <section className="rounded-2xl border border-beige bg-cream-light p-5 shadow-soft sm:p-6">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-display text-lg text-forest">Competency profile</h2>
            <Link to="/progress" className="text-xs font-medium text-moss-600 hover:underline">
              See details
            </Link>
          </div>
          <CompetencyRadar competencies={data.competencies} />
          <ul className="mt-2 space-y-2">
            {data.competencies.map((competency) => {
              const band = scoreBand(competency.score)
              return (
                <li key={competency.key} className="flex items-center gap-3">
                  <span className="w-[132px] shrink-0 truncate text-xs text-ink">{competency.label}</span>
                  <Progress value={competency.score} size="sm" label={competency.label} className="flex-1" />
                  <span className="w-[86px] shrink-0 text-right text-xs text-ink-muted">
                    <span className="font-medium text-forest">{competency.score}%</span> {band.label}
                  </span>
                </li>
              )
            })}
          </ul>
        </section>

        <section className="rounded-2xl border border-beige bg-cream-light p-5 shadow-soft sm:p-6">
          <h2 className="font-display text-lg text-forest">Consultations this week</h2>
          <p className="mt-1 text-sm text-ink-muted">
            {user?.streakDays ?? 0}-day streak
          </p>
          <ActivityBars data={data.weeklyActivity} />
          <ul className="mt-2 grid grid-cols-7 gap-1 text-center text-[10px] text-ink-muted">
            {data.weeklyActivity.map((day) => (
              <li key={day.label}>
                <span className="block font-medium text-forest">{day.consultations}</span>
                {day.label}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="rounded-2xl border border-beige bg-cream-light p-5 shadow-soft sm:p-6">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-display text-lg text-forest">Recent simulations</h2>
          <Link to="/history" className="text-xs font-medium text-moss-600 hover:underline">
            View all history
          </Link>
        </div>
        <div className="mt-3">
          <AttemptTable attempts={data.recentAttempts} caption="Your most recent consultations" />
        </div>
      </section>
    </div>
  )
}
