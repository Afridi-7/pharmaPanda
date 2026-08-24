import { Link, useLocation } from 'react-router-dom'
import { ArrowLeft, Hammer } from 'lucide-react'
import { buttonVariants } from '@/components/ui/Button'
import { PageHeader } from '@/components/common/States'
import { cn } from '@/lib/utils'

interface ComingSoonPageProps {
  title: string
  /** One line on what this section will do, in the product's own voice. */
  description: string
  /** What already exists behind the scenes, so the placeholder is honest about status. */
  groundwork?: string
}

/**
 * Placeholder for a navigable section that has not been built yet.
 *
 * This exists so the sidebar cannot eject the user from the authenticated app:
 * previously these paths fell through to the router's catch-all and redirected
 * to the public landing page, which read as being logged out. Rendering inside
 * AppLayout keeps the chrome, the session and the user's place.
 */
export function ComingSoonPage({ title, description, groundwork }: ComingSoonPageProps) {
  const location = useLocation()

  return (
    <div className="space-y-6">
      <PageHeader title={title} subtitle={description} />

      <section className="rounded-2xl border border-beige bg-cream-light p-6 shadow-soft sm:p-8">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <div className="min-w-0">
            <h2 className="inline-flex items-center gap-2 font-display text-lg text-forest">
              <Hammer className="h-4.5 w-4.5 text-sage" strokeWidth={1.9} />
              Not built yet
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
              This section is on the roadmap but has no screen yet. You are still signed in — nothing
              has gone wrong.
            </p>
            {groundwork && (
              <p className="mt-2 text-[13px] leading-relaxed text-ink-muted">
                <span className="font-medium text-forest">Already in place:</span> {groundwork}
              </p>
            )}
            <p className="mt-2 text-[11px] text-ink-muted">
              Route: <code className="rounded bg-cream px-1.5 py-0.5">{location.pathname}</code>
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <Link to="/dashboard" className={cn(buttonVariants({ variant: 'primary', size: 'sm' }))}>
            <ArrowLeft className="h-4 w-4" strokeWidth={2} />
            Back to Dashboard
          </Link>
          <Link to="/simulations" className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }))}>
            Browse simulations
          </Link>
        </div>
      </section>
    </div>
  )
}
