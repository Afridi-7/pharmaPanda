import { Link, Navigate, Outlet, useLocation } from 'react-router-dom'
import { Logo } from '@/components/brand/PandaMascot'
import { buttonVariants } from '@/components/ui/Button'
import { LoadingState } from '@/components/common/States'
import { useAuth } from '@/hooks/useAuth'

/** Marketing shell: header, content, footer. */
export function PublicLayout() {
  return (
    <div className="min-h-screen bg-cream">
      <header className="sticky top-0 z-30 border-b border-beige bg-cream/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" aria-label="PharmaPanda home">
            <Logo />
          </Link>
          <nav className="flex items-center gap-2" aria-label="Account">
            <Link to="/simulations" className="hidden text-sm text-ink-muted hover:text-forest sm:block">
              Explore simulations
            </Link>
            <Link to="/login" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
              Sign in
            </Link>
            <Link to="/register" className={buttonVariants({ variant: 'primary', size: 'sm' })}>
              Start practicing
            </Link>
          </nav>
        </div>
      </header>
      <Outlet />
      <footer className="border-t border-beige bg-cream-light">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <Logo size="sm" />
          <p className="text-xs text-ink-muted">
            Practice pharmacy before practicing pharmacy. · Educational simulation only — not clinical advice.
          </p>
        </div>
      </footer>
    </div>
  )
}

/** Split-screen shell for sign in / register / onboarding. */
export function AuthLayout() {
  return (
    <div className="min-h-screen bg-cream">
      <Outlet />
    </div>
  )
}

/** Distraction-free shell for the consultation player. */
export function FocusLayout() {
  return (
    <div className="min-h-screen bg-cream">
      <Outlet />
    </div>
  )
}

export function RequireAuth() {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-cream px-4">
        <LoadingState message="preparing" className="w-full max-w-sm" />
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (!user.onboarded && location.pathname !== '/onboarding') return <Navigate to="/onboarding" replace />
  return <Outlet />
}
