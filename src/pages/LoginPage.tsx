import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Logo } from '@/components/brand/PandaMascot'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Field'
import { useAuth } from '@/hooks/useAuth'
import { ApiError } from '@/services/api'

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path fill="#4285F4" d="M23 12.2c0-.8-.1-1.5-.2-2.2H12v4.2h6.2A5.3 5.3 0 0 1 12 18.3a6.3 6.3 0 0 1 0-12.6 6 6 0 0 1 4.2 1.6l2.9-2.9A10.3 10.3 0 0 0 12 1.7a10.4 10.4 0 1 0 11 10.5Z" />
    </svg>
  )
}

/** Warm two-column sign in, backed by the real authentication API. */
export function LoginPage() {
  const navigate = useNavigate()
  const { signIn, signInWithGoogle } = useAuth()
  // Starts empty: real accounts, so the user types their own credentials.
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const user = await signIn(email, password)
      navigate(user.onboarded ? '/dashboard' : '/onboarding')
    } catch (err) {
      setError(err instanceof ApiError ? err.userMessage : 'We couldn’t sign you in. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  // Google OAuth is not implemented yet. The service rejects rather than
  // signing in a fake user, and the button explains why.
  const google = async () => {
    setBusy(true)
    try {
      const user = await signInWithGoogle()
      navigate(user.onboarded ? '/dashboard' : '/onboarding')
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.userMessage
          : 'Google sign-in isn’t enabled yet. Please use your email address and password.',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <section className="flex flex-col justify-center px-5 py-12 sm:px-10 lg:px-16">
        <div className="mx-auto w-full max-w-sm">
          <Link to="/" aria-label="PharmaPanda home">
            <Logo />
          </Link>

          <h1 className="mt-9 font-display text-[26px] leading-tight text-forest">Sign in</h1>
          <p className="mt-2.5 text-sm leading-relaxed text-ink-muted">
            Continue where you left off.
          </p>

          <form onSubmit={submit} className="mt-7 space-y-4" noValidate>
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              placeholder="you@university.edu"
              required
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              placeholder="••••••••"
              error={error ?? undefined}
              required
            />
            <Button type="submit" block disabled={busy}>
              {busy ? 'Signing in…' : 'Sign In'}
            </Button>
          </form>

          <div className="my-5 flex items-center gap-3">
            <span className="h-px flex-1 bg-beige" />
            <span className="text-[11px] uppercase tracking-[0.14em] text-ink-muted">or</span>
            <span className="h-px flex-1 bg-beige" />
          </div>

          <Button
            variant="secondary"
            block
            onClick={google}
            disabled={busy}
            aria-describedby="google-unavailable"
          >
            <GoogleMark />
            Continue with Google
          </Button>
          <p id="google-unavailable" className="mt-1.5 text-center text-[11px] text-ink-muted">
            Google sign-in isn’t enabled yet — use your email address below.
          </p>

          <div className="mt-6 flex items-center justify-between text-sm">
            <button
              type="button"
              className="text-ink-muted hover:text-forest"
              onClick={() => setError('Password reset isn’t available yet. Please create a new account.')}
            >
              Forgot password?
            </button>
            <Link to="/register" className="font-medium text-moss-600 hover:underline">
              Create account
            </Link>
          </div>
        </div>
      </section>

      <section className="relative hidden flex-col justify-center bg-forest px-16 lg:flex">
        <div className="max-w-md">
          <h2 className="font-display text-2xl leading-snug text-cream-light">
            Over-the-counter consultation practice
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-sage">
            Each case withholds the detail that determines the safe answer: an aspirin allergy, a warfarin
            prescription, an ulcer three years ago. The consultation is assessed on whether you found it.
          </p>
          <dl className="mt-9 grid grid-cols-3 gap-4 border-t border-forest-700 pt-6">
            {[
              { k: '10', v: 'clinical cases' },
              { k: '6', v: 'competencies scored' },
            ].map((stat) => (
              <div key={stat.v}>
                <dt className="font-display text-2xl text-cream-light">{stat.k}</dt>
                <dd className="text-xs text-sage">{stat.v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    </div>
  )
}
