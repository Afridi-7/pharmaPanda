import type { ReactNode } from 'react'
import { TrendingDown, TrendingUp } from 'lucide-react'
import { cn, scoreBand } from '@/lib/utils'
import { useCountUp } from '@/hooks/useMediaQuery'

const bandTone: Record<ReturnType<typeof scoreBand>['tone'], { ring: string; text: string; chip: string }> = {
  strong: { ring: '#5F8068', text: 'text-forest', chip: 'border-sage/60 bg-sage-100 text-forest' },
  solid: { ring: '#A8B9A3', text: 'text-forest', chip: 'border-sage/60 bg-sage-100 text-forest' },
  developing: { ring: '#E7C979', text: 'text-[#7A5C10]', chip: 'border-honey-600/40 bg-honey-100 text-[#7A5C10]' },
  attention: { ring: '#C98267', text: 'text-terracotta-600', chip: 'border-terracotta/40 bg-terracotta-100 text-terracotta-600' },
}

interface ScoreRingProps {
  score: number
  size?: number
  label?: string
  /** Adds the band wording so status is never conveyed by colour alone. */
  showBand?: boolean
  className?: string
  animate?: boolean
}

export function ScoreRing({ score, size = 132, label, showBand = true, className, animate = true }: ScoreRingProps) {
  const band = scoreBand(score)
  const shown = useCountUp(score, animate ? 900 : 0)
  const stroke = Math.max(7, Math.round(size * 0.075))
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - Math.max(0, Math.min(100, shown)) / 100)

  return (
    <div className={cn('inline-flex flex-col items-center gap-2', className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90" role="img" aria-label={`${label ?? 'Score'}: ${score} out of 100, ${band.label}`}>
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#E8DFCF" strokeWidth={stroke} />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={bandTone[band.tone].ring}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 700ms ease-out' }}
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <div className="text-center">
            <p className={cn('font-display leading-none', bandTone[band.tone].text)} style={{ fontSize: size * 0.28 }}>
              {Math.round(shown)}
            </p>
            <p className="mt-0.5 text-[11px] uppercase tracking-[0.12em] text-ink-muted">/ 100</p>
          </div>
        </div>
      </div>
      {showBand && (
        <span className={cn('rounded-full border px-2.5 py-0.5 text-xs font-medium', bandTone[band.tone].chip)}>
          {band.label}
        </span>
      )}
      {label && <p className="text-sm text-ink-muted">{label}</p>}
    </div>
  )
}

interface StatCardProps {
  label: string
  value: number
  suffix?: string
  trend?: string
  icon?: ReactNode
  className?: string
}

export function StatCard({ label, value, suffix = '%', trend, icon, className }: StatCardProps) {
  const shown = useCountUp(value)
  const band = scoreBand(value)
  const improving = trend?.trim().startsWith('+')
  return (
    <div className={cn('rounded-2xl border border-beige bg-cream-light p-3.5 shadow-soft sm:p-5', className)}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-[10.5px] font-medium uppercase leading-tight tracking-[0.08em] text-ink-muted sm:text-xs sm:tracking-[0.1em]">
          {label}
        </p>
        {icon && <span className="text-sage">{icon}</span>}
      </div>
      <p className="mt-1.5 font-display text-[22px] leading-none text-forest sm:mt-2 sm:text-[26px]">
        {Math.round(shown)}
        <span className="text-base text-ink-muted">{suffix}</span>
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-1.5 sm:gap-2">
        <span className={cn('rounded-full border px-2 py-0.5 text-[11px] font-medium', bandTone[band.tone].chip)}>
          {band.label}
        </span>
        {trend && (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-ink-muted">
            {improving ? (
              <TrendingUp className="h-3.5 w-3.5 text-moss" strokeWidth={2} />
            ) : (
              <TrendingDown className="h-3.5 w-3.5 text-terracotta" strokeWidth={2} />
            )}
            {trend}
          </span>
        )}
      </div>
    </div>
  )
}
