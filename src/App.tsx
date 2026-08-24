import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { AppLayout } from '@/layouts/AppLayout'
import { AuthLayout, FocusLayout, PublicLayout, RequireAuth } from '@/layouts/Shells'
import { SimulationPlayerPage } from '@/pages/SimulationPlayerPage'
import { ComingSoonPage } from '@/pages/ComingSoonPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { LandingPage } from '@/pages/LandingPage'
import { LoginPage } from '@/pages/LoginPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { OnboardingPage } from '@/pages/OnboardingPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { SimulationDetailPage } from '@/pages/SimulationDetailPage'
import { SimulationsPage } from '@/pages/SimulationsPage'

/**
 * Route table.
 *
 * Every destination the sidebar links to is registered here. Sections without a
 * screen yet render `ComingSoonPage` *inside* AppLayout rather than being left
 * unrouted: an unrouted path fell through to the catch-all and redirected to the
 * public landing page, which looked exactly like being signed out.
 */
/**
 * Terminal route for anything unmatched.
 *
 * A signed-in user gets a 404 inside the app chrome (rendered by the nested
 * route below, so AppLayout's own <Outlet /> is used); a signed-out visitor
 * goes to the public landing page. While the session is still being restored we
 * render nothing rather than guessing — otherwise a slow `/auth/me` would flash
 * the landing page at an authenticated user.
 */
function CatchAll() {
  const { user, loading } = useAuth()

  if (loading) return null
  if (!user) return <Navigate to="/" replace />
  return <AppLayout />
}

export function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
      </Route>

      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* Onboarding is gated on a session but sits outside the app chrome. */}
      <Route element={<RequireAuth />}>
        <Route element={<AuthLayout />}>
          <Route path="/onboarding" element={<OnboardingPage />} />
        </Route>

        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/simulations" element={<SimulationsPage />} />
          <Route path="/simulations/:id" element={<SimulationDetailPage />} />

          {/* Built services and data, no screen yet. See ComingSoonPage. */}
          <Route
            path="/results/:id"
            element={
              <ComingSoonPage
                title="Consultation Results"
                description="Your score, competency breakdown and reasoning timeline for a finished case."
                groundwork="The evaluation engine already scores six competencies and builds the full report — evaluationService.getByAttempt() returns it today."
              />
            }
          />
          <Route
            path="/progress"
            element={
              <ComingSoonPage
                title="My Progress"
                description="How your six competencies are trending across every consultation."
                groundwork="competencyService and the radar, bar and trend charts are implemented."
              />
            }
          />
          <Route
            path="/history"
            element={
              <ComingSoonPage
                title="History"
                description="Every consultation you have completed, with scores and dates."
                groundwork="dashboardService.history() and the AttemptTable component are implemented."
              />
            }
          />
          <Route
            path="/achievements"
            element={
              <ComingSoonPage
                title="Achievements"
                description="Milestones you have unlocked as your practice deepens."
                groundwork="competencyService.achievements() already reacts to real consultation behaviour."
              />
            }
          />
          <Route
            path="/calculations"
            element={
              <ComingSoonPage
                title="Pharmacy Calculations"
                description="Dosing, concentration, dilution and infusion-rate practice with worked explanations."
                groundwork="calculationService and a full problem set with step-by-step solutions are implemented."
              />
            }
          />
          <Route
            path="/calculations/:id"
            element={
              <ComingSoonPage
                title="Calculation Problem"
                description="A single worked calculation with marking and an explanation."
                groundwork="calculationService.get() and .check() already mark answers and detect factor-of-ten errors."
              />
            }
          />
          <Route
            path="/drugs"
            element={
              <ComingSoonPage
                title="Drug Knowledge"
                description="Counselling points, interactions and safety considerations."
                groundwork="drugService.search() and the drug dataset are implemented."
              />
            }
          />
          <Route
            path="/drugs/:id"
            element={
              <ComingSoonPage
                title="Drug Monograph"
                description="A single drug entry with counselling and safety detail."
                groundwork="drugService.get() and .related() are implemented."
              />
            }
          />
          <Route
            path="/profile"
            element={
              <ComingSoonPage
                title="Profile"
                description="Your account details and learning goals."
                groundwork="Backed by real auth — PATCH /api/auth/profile updates the PostgreSQL row today."
              />
            }
          />
          <Route
            path="/settings"
            element={
              <ComingSoonPage
                title="Settings"
                description="Practice preferences, notifications and account controls."
                groundwork="settingsService is implemented against the local store."
              />
            }
          />

        </Route>

        {/* The consultation takes the full viewport — no sidebar, no chrome. */}
        <Route element={<FocusLayout />}>
          <Route path="/attempt/:id" element={<SimulationPlayerPage />} />
        </Route>
      </Route>

      {/*
        Unknown path. `CatchAll` decides where it goes based on session state:
        signed-in users stay inside the app on a 404, signed-out users land on
        the public page. A bare redirect to "/" here would eject a signed-in
        user to the marketing page, which reads as being logged out.
      */}
      <Route path="*" element={<CatchAll />}>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
