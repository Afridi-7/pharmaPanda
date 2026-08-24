import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  eyebrow?: string
  title: string
  subtitle?: string
  actions?: ReactNode
  className?: string
}

export function PageHeader({ eyebrow, title, subtitle, actions, className }: PageHeaderProps) {
  return (
    <div className={cn('flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div>
        {eyebrow && (
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted">{eyebrow}</p>
        )}
        <h1 className="mt-1 font-display text-2xl text-forest sm:text-[28px]">{title}</h1>
        {subtitle && <p className="mt-1.5 max-w-2xl text-sm text-ink-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

interface EmptyStateProps {
  title?: string
  description?: string
  action?: ReactNode
  className?: string
}

export function EmptyState({
  title = 'Nothing here yet.',
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center gap-3 rounded-2xl border border-dashed border-beige-dark bg-cream/60 px-6 py-12 text-center', className)}>
      <h3 className="font-display text-lg text-forest">{title}</h3>
      {description && <p className="max-w-sm text-sm text-ink-muted">{description}</p>}
      {action}
    </div>
  )
}

interface ErrorStateProps {
  /** Already-safe, user-facing copy. Raw API errors never reach this component. */
  message?: string
  onRetry?: () => void
  backTo?: { href: string; label: string }
  className?: string
}

export function ErrorState({ message, onRetry, backTo, className }: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn('flex flex-col items-center gap-3 rounded-2xl border border-terracotta/35 bg-terracotta-100/60 px-6 py-12 text-center', className)}
    >
      <span className="grid h-11 w-11 place-items-center rounded-full bg-terracotta/15 text-terracotta-600">
        <AlertTriangle className="h-5 w-5" strokeWidth={1.9} />
      </span>
      <h3 className="font-display text-lg text-forest">Something went wrong</h3>
      <p className="max-w-sm text-sm text-ink-muted">{message ?? 'We couldn’t load this simulation.'}</p>
      <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
        {onRetry && (
          <Button variant="secondary" size="sm" onClick={onRetry}>
            <RefreshCw className="h-4 w-4" strokeWidth={1.9} />
            Try Again
          </Button>
        )}
        {backTo && (
          <Link to={backTo.href} className={buttonVariants({ variant: 'quiet', size: 'sm' })}>
            {backTo.label}
          </Link>
        )}
      </div>
    </div>
  )
}

interface LoadingStateProps {
  message?: 'thinking' | 'reviewing' | 'preparing'
  className?: string
}

const loadingCopy = {
  thinking: 'Waiting for the patient',
  reviewing: 'Reviewing consultation',
  preparing: 'Loading case',
}

export function LoadingState({ message = 'preparing', className }: LoadingStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn('flex flex-col items-center gap-3 rounded-2xl border border-beige bg-cream-light px-6 py-14 text-center', className)}
    >
      <p className="text-sm font-medium text-forest">{loadingCopy[message]}</p>
      <div className="flex gap-1.5" aria-hidden>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-sage motion-safe:animate-soft-pulse"
            style={{ animationDelay: `${i * 160}ms` }}
          />
        ))}
      </div>
    </div>
  )
}

export function CardSkeletonGrid({ count = 6, className }: { count?: number; className?: string }) {
  return (
    <div className={cn('grid gap-4 sm:grid-cols-2 xl:grid-cols-3', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-beige bg-cream-light p-5">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="mt-3 h-5 w-3/4" />
          <Skeleton className="mt-2 h-4 w-full" />
          <Skeleton className="mt-2 h-4 w-2/3" />
          <Skeleton className="mt-5 h-9 w-28" />
        </div>
      ))}
    </div>
  )
}
