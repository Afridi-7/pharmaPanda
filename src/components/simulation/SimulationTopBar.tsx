import { Link } from 'react-router-dom'
import { Clock, LogOut } from 'lucide-react'
import { Progress } from '@/components/ui/Badge'
import { cn, formatDuration } from '@/lib/utils'

interface SimulationTopBarProps {
  title: string
  subtitle?: string
  seconds: number
  /** 0–100 completion of the consultation objectives. */
  progress: number
  progressLabel: string
  onExit: () => void
  exitLabel?: string
  /** Turns amber past the expected duration instead of shouting. */
  softLimitSeconds?: number
}

export function SimulationTopBar({
  title,
  subtitle,
  seconds,
  progress,
  progressLabel,
  onExit,
  exitLabel = 'Exit',
  softLimitSeconds,
}: SimulationTopBarProps) {
  const overrun = softLimitSeconds !== undefined && seconds > softLimitSeconds
  return (
    <header className="sticky top-0 z-30 border-b border-beige bg-cream-light/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-1.5 px-4 py-2 sm:gap-2 sm:px-6 sm:py-3 lg:flex-row lg:items-center lg:gap-6">
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-display text-[15px] text-forest sm:text-lg">{title}</h1>
          {subtitle && <p className="truncate text-xs text-ink-muted">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-3 sm:gap-5">
          <div className="hidden min-w-[190px] flex-1 sm:block">
            <div className="mb-1 flex items-center justify-between text-[11px] text-ink-muted">
              <span>{progressLabel}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} size="sm" label={progressLabel} />
          </div>
          <p
            className={cn(
              'inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-sm font-medium tabular-nums',
              overrun ? 'border-honey-600/40 bg-honey-100 text-[#7A5C10]' : 'border-beige-dark bg-cream text-forest',
            )}
            aria-label={`Elapsed time ${formatDuration(seconds)}`}
          >
            <Clock className="h-4 w-4" strokeWidth={1.9} />
            {formatDuration(seconds)}
          </p>
          <button
            type="button"
            onClick={onExit}
            className="inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-sm text-ink-muted transition-colors hover:bg-beige/50 hover:text-forest"
          >
            <LogOut className="h-4 w-4" strokeWidth={1.9} />
            {exitLabel}
          </button>
        </div>
      </div>
      <div className="px-4 pb-1.5 sm:hidden">
        <Progress value={progress} size="sm" label={progressLabel} />
      </div>
    </header>
  )
}

export function BackLink({ to, children }: { to: string; children: string }) {
  return (
    <Link to={to} className="text-sm text-ink-muted transition-colors hover:text-forest">
      ← {children}
    </Link>
  )
}
