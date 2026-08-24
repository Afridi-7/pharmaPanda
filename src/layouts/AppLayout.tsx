import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Calculator,
  ClipboardList,
  Flame,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  Pill,
  Search,
  Settings as SettingsIcon,
  Stethoscope,
  TrendingUp,
  User as UserIcon,
  X,
} from 'lucide-react'
import { Logo, PandaMascot } from '@/components/brand/PandaMascot'
import { useAuth } from '@/hooks/useAuth'
import { useIsDesktop } from '@/hooks/useMediaQuery'
import { cn, initials } from '@/lib/utils'

const navGroups = [
  {
    label: 'Main',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/simulations', label: 'Simulations', icon: Stethoscope },
      { to: '/progress', label: 'My Progress', icon: TrendingUp },
      { to: '/history', label: 'History', icon: History },
    ],
  },
  {
    label: 'Practice',
    items: [
      { to: '/simulations?view=clinical', label: 'Clinical Cases', icon: ClipboardList },
      { to: '/calculations', label: 'Calculations', icon: Calculator },
      { to: '/drugs', label: 'Drug Knowledge', icon: Pill },
    ],
  },
  {
    label: 'Personal',
    items: [
      { to: '/achievements', label: 'Achievements', icon: Flame },
      { to: '/profile', label: 'Profile', icon: UserIcon },
      { to: '/settings', label: 'Settings', icon: SettingsIcon },
    ],
  },
]

const mobileNav = [
  { to: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { to: '/simulations', label: 'Cases', icon: Stethoscope },
  { to: '/progress', label: 'Progress', icon: TrendingUp },
  { to: '/profile', label: 'Profile', icon: UserIcon },
]

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="flex h-full flex-col">
      <div className="px-5 py-5">
        <Link to="/dashboard" onClick={onNavigate} aria-label="PharmaPanda home">
          <Logo />
        </Link>
      </div>
      <nav className="flex-1 overflow-y-auto scroll-slim px-3 pb-4" aria-label="Main navigation">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-5">
            <p className="px-2 pb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-ink-muted/80">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => (
                <li key={item.to + item.label}>
                  <NavLink
                    to={item.to}
                    onClick={onNavigate}
                    end={item.to === '/dashboard'}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm transition-colors',
                        isActive
                          ? 'bg-forest text-cream-light'
                          : 'text-ink hover:bg-beige/60 hover:text-forest',
                      )
                    }
                  >
                    <item.icon className="h-4.5 w-4.5 shrink-0" strokeWidth={1.8} />
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
      <div className="border-t border-beige p-3">
        <Link
          to="/profile"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-beige/50"
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-sage-100 text-xs font-semibold text-forest">
            {user ? initials(user.firstName, user.lastName) : ''}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium text-forest">
              {user ? `${user.firstName} ${user.lastName}`.trim() : ''}
            </span>
            <span className="block truncate text-[11px] text-ink-muted">{user?.university}</span>
            <span className="block truncate text-[11px] text-ink-muted">{user?.year}</span>
          </span>
        </Link>
        <button
          type="button"
          onClick={async () => {
            await signOut()
            navigate('/login')
          }}
          className="mt-1 flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-ink-muted transition-colors hover:bg-beige/50 hover:text-forest"
        >
          <LogOut className="h-4 w-4" strokeWidth={1.8} />
          Sign out
        </button>
      </div>
    </div>
  )
}

export function AppLayout() {
  const [open, setOpen] = useState(false)
  const isDesktop = useIsDesktop()
  const location = useLocation()
  const { user } = useAuth()

  useEffect(() => setOpen(false), [location.pathname])

  return (
    <div className="min-h-screen bg-cream">
      {isDesktop && (
        <aside className="fixed inset-y-0 left-0 z-30 w-[264px] border-r border-beige bg-cream-light">
          <SidebarContent />
        </aside>
      )}

      <AnimatePresence>
        {!isDesktop && open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-forest-900/40"
              onClick={() => setOpen(false)}
            />
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', stiffness: 340, damping: 32 }}
              className="fixed inset-y-0 left-0 z-50 w-[268px] border-r border-beige bg-cream-light"
            >
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="absolute right-3 top-4 rounded-lg p-1.5 text-ink-muted hover:bg-beige/60"
              >
                <X className="h-5 w-5" strokeWidth={1.8} />
              </button>
              <SidebarContent onNavigate={() => setOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className={cn(isDesktop && 'pl-[264px]')}>
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-beige bg-cream-light/90 px-4 backdrop-blur sm:px-6">
          {!isDesktop && (
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
              className="rounded-xl border border-beige-dark p-2 text-forest"
            >
              <Menu className="h-5 w-5" strokeWidth={1.8} />
            </button>
          )}
          {!isDesktop && <Logo size="sm" withWordmark={false} />}
          <Link
            to="/simulations"
            className="ml-auto hidden items-center gap-2 rounded-xl border border-beige-dark px-3 py-2 text-sm text-ink-muted transition-colors hover:border-sage hover:text-forest sm:flex"
          >
            <Search className="h-4 w-4" strokeWidth={1.8} />
            Find a case
          </Link>
          <div className={cn('flex items-center gap-2', !isDesktop && 'ml-auto')}>
            {/* Only shown once there is a streak to show. */}
            {(user?.streakDays ?? 0) > 0 && (
              <span className="hidden rounded-xl bg-honey-100 px-2.5 py-1 text-xs font-medium text-[#7A5C10] sm:inline-flex sm:items-center sm:gap-1.5">
                <Flame className="h-3.5 w-3.5" strokeWidth={2} />
                {user?.streakDays}-day streak
              </span>
            )}
            <Link to="/profile" aria-label="Your profile" className="grid h-9 w-9 place-items-center rounded-full bg-sage-100 text-xs font-semibold text-forest">
              {user ? initials(user.firstName, user.lastName) : ''}
            </Link>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1180px] px-4 pb-24 pt-6 sm:px-6 lg:pb-12">
          <Outlet />
        </main>
      </div>

      {!isDesktop && (
        <nav
          aria-label="Quick navigation"
          className="fixed bottom-0 left-0 right-0 z-30 grid grid-cols-4 border-t border-beige bg-cream-light/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
        >
          {mobileNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors',
                  isActive ? 'text-forest' : 'text-ink-muted',
                )
              }
            >
              <item.icon className="h-5 w-5" strokeWidth={1.8} />
              {item.label}
            </NavLink>
          ))}
        </nav>
      )}
    </div>
  )
}
