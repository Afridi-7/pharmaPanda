import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { AppLayout } from '@/layouts/AppLayout'
import { AuthLayout, FocusLayout, PublicLayout, RequireAuth } from '@/layouts/Shells'
import { SimulationPlayerPage } from '@/pages/SimulationPlayerPage'
import { CalculationProblemPage } from '@/pages/CalculationProblemPage'
import { CalculationsPage } from '@/pages/CalculationsPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { DrugDetailPage } from '@/pages/DrugDetailPage'
import { DrugsPage } from '@/pages/DrugsPage'
import { LandingPage } from '@/pages/LandingPage'
import { LoginPage } from '@/pages/LoginPage'
import { HistoryPage } from '@/pages/HistoryPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { OnboardingPage } from '@/pages/OnboardingPage'
import { ProfilePage } from '@/pages/ProfilePage'
import { ProgressPage } from '@/pages/ProgressPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { ResultsPage } from '@/pages/ResultsPage'
import { SimulationDetailPage } from '@/pages/SimulationDetailPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { SimulationsPage } from '@/pages/SimulationsPage'

/**
 * Route table.
 *
 * Every destination the sidebar links to is registered here. Nothing falls
 * through to the catch-all: an unrouted path used to redirect to the public
 * landing page, which looked exactly like being signed out.
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

          <Route path="/results/:id" element={<ResultsPage />} />

          <Route path="/progress" element={<ProgressPage />} />
          <Route path="/history" element={<HistoryPage />} />
          {/* Achievements live on the Progress page rather than their own screen. */}
          <Route path="/achievements" element={<Navigate to="/progress" replace />} />

          <Route path="/calculations" element={<CalculationsPage />} />
          <Route path="/calculations/:id" element={<CalculationProblemPage />} />
          <Route path="/drugs" element={<DrugsPage />} />
          <Route path="/drugs/:id" element={<DrugDetailPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />

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
