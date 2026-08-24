import { Link, useLocation } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { buttonVariants } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

/**
 * Unknown path inside the authenticated app.
 *
 * Rendered within AppLayout so a mistyped URL keeps the user signed in and
 * oriented, instead of bouncing them to the public landing page.
 */
export function NotFoundPage() {
  const location = useLocation()

  return (
    <div className="grid min-h-[60vh] place-items-center px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-2xl text-forest">Page not found</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          There’s nothing at{' '}
          <code className="rounded bg-cream px-1.5 py-0.5 text-[12px]">{location.pathname}</code>. You
          are still signed in.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link to="/dashboard" className={cn(buttonVariants({ variant: 'primary', size: 'sm' }))}>
            <ArrowLeft className="h-4 w-4" strokeWidth={2} />
            Back to Dashboard
          </Link>
          <Link to="/simulations" className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }))}>
            Browse simulations
          </Link>
        </div>
      </div>
    </div>
  )
}
