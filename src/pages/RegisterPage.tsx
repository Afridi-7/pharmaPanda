import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { YearOfStudy } from '@/types'
import { Logo } from '@/components/brand/PandaMascot'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Field'
import { useAuth } from '@/hooks/useAuth'
import { ApiError } from '@/services/api'

const years: YearOfStudy[] = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year', 'Graduate']

export function RegisterPage() {
  const navigate = useNavigate()
  const { register } = useAuth()
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirm: '',
    university: 'University of Debrecen',
    year: '3rd Year' as YearOfStudy,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)

  const set = (key: keyof typeof form) => (value: string) => setForm((prev) => ({ ...prev, [key]: value }))

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const next: Record<string, string> = {}
    if (!form.firstName.trim()) next.firstName = 'First name is required.'
    if (!form.lastName.trim()) next.lastName = 'Last name is required.'
    if (!form.email.includes('@')) next.email = 'Enter a valid email address.'
    if (form.password.length < 8) next.password = 'Use at least 8 characters.'
    if (form.password !== form.confirm) next.confirm = 'Passwords do not match.'
    if (!form.university.trim()) next.university = 'University is required.'
    setErrors(next)
    if (Object.keys(next).length > 0) return

    setBusy(true)
    try {
      await register({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        password: form.password,
        university: form.university.trim(),
        year: form.year,
      })
      navigate('/onboarding')
    } catch (err) {
      setErrors({ email: err instanceof ApiError ? err.userMessage : 'We couldn’t create your account just yet.' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_0.85fr]">
      <section className="flex flex-col justify-center px-5 py-12 sm:px-10 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          <Link to="/" aria-label="PharmaPanda home">
            <Logo />
          </Link>

          <h1 className="mt-8 font-display text-[26px] leading-tight text-forest">Create an account</h1>
          <p className="mt-2 text-sm text-ink-muted">
            Case difficulty is set from your stated experience level.
          </p>

          <form onSubmit={submit} className="mt-7 space-y-4" noValidate>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="First name"
                value={form.firstName}
                onChange={(e) => set('firstName')(e.target.value)}
                error={errors.firstName}
                autoComplete="given-name"
              />
              <Input
                label="Last name"
                value={form.lastName}
                onChange={(e) => set('lastName')(e.target.value)}
                error={errors.lastName}
                autoComplete="family-name"
              />
            </div>
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => set('email')(e.target.value)}
              error={errors.email}
              autoComplete="email"
              placeholder="you@university.edu"
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Password"
                type="password"
                value={form.password}
                onChange={(e) => set('password')(e.target.value)}
                error={errors.password}
                hint="At least 8 characters."
                autoComplete="new-password"
              />
              <Input
                label="Confirm password"
                type="password"
                value={form.confirm}
                onChange={(e) => set('confirm')(e.target.value)}
                error={errors.confirm}
                autoComplete="new-password"
              />
            </div>
            <Input
              label="University"
              value={form.university}
              onChange={(e) => set('university')(e.target.value)}
              error={errors.university}
            />
            <Select label="Year of study" value={form.year} onChange={(e) => set('year')(e.target.value)}>
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </Select>
            <Button type="submit" block disabled={busy}>
              {busy ? 'Creating your account…' : 'Create Account'}
            </Button>
          </form>

          <p className="mt-6 text-sm text-ink-muted">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-moss-600 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </section>

      <section className="hidden flex-col justify-center bg-sage-100 px-14 lg:flex">
        <h2 className="font-display text-2xl leading-snug text-forest">
          What the account gives you
        </h2>
        <ul className="mt-6 space-y-3 text-sm text-ink">
          {[
            'Ten consultation cases with information withheld until asked for.',
            'Assessment based on the history taken and the reasoning given.',
            'Six competencies tracked across every attempt.',
          ].map((line) => (
            <li key={line} className="rounded-xl border border-sage/60 bg-cream-light px-3.5 py-3">
              {line}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
