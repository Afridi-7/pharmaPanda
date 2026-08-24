import type { HTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
  {
    variants: {
      tone: {
        neutral: 'border-beige-dark bg-cream text-ink-muted',
        forest: 'border-forest/15 bg-forest/10 text-forest',
        sage: 'border-sage/60 bg-sage-100 text-forest',
        honey: 'border-honey-600/40 bg-honey-100 text-[#7A5C10]',
        terracotta: 'border-terracotta/40 bg-terracotta-100 text-terracotta-600',
        alert: 'border-alert/35 bg-alert-100 text-alert',
        outline: 'border-beige-dark bg-transparent text-ink-muted',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
)

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />
}

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('animate-soft-pulse rounded-xl bg-beige/70', className)} aria-hidden {...props} />
}

interface ProgressProps {
  value: number
  label?: string
  tone?: 'moss' | 'honey' | 'terracotta' | 'alert' | 'forest'
  size?: 'sm' | 'md'
  className?: string
}

const progressTones: Record<NonNullable<ProgressProps['tone']>, string> = {
  moss: 'bg-moss',
  honey: 'bg-honey-600',
  terracotta: 'bg-terracotta',
  alert: 'bg-alert',
  forest: 'bg-forest',
}

export function Progress({ value, label, tone = 'moss', size = 'md', className }: ProgressProps) {
  const clamped = Math.max(0, Math.min(100, value))
  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cn('w-full overflow-hidden rounded-full bg-beige', size === 'sm' ? 'h-1.5' : 'h-2.5', className)}
    >
      <div
        className={cn('h-full rounded-full transition-[width] duration-700 ease-out', progressTones[tone])}
        style={{ width: `${clamped}%` }}
      />
    </div>
  )
}
