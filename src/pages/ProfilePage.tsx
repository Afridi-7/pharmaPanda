import { useEffect, useState, type FormEvent } from 'react'
import { Check } from 'lucide-react'
import type { ExperienceLevel, LearningGoal, YearOfStudy } from '@/types'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Field'
import { LoadingState, PageHeader } from '@/components/common/States'
import { useAuth } from '@/hooks/useAuth'
import { ApiError } from '@/services/api'
import { cn, formatDate, initials } from '@/lib/utils'

const years: YearOfStudy[] = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year', 'Graduate']
const experiences: ExperienceLevel[] = ['Beginner', 'Intermediate', 'Advanced']

interface ProfileForm {
  firstName: string
  lastName: string
  university: string
  year: YearOfStudy
  experience: ExperienceLevel
  learningGoals: LearningGoal[]
}

// 'OSCE preparation' is deliberately absent: the OSCE section was removed, so
// it is no longer offered even though existing accounts may still hold it.
const goals: LearningGoal[] = [
  'Clinical reasoning',
  'Patient counseling',
  'Medication safety',
  'History taking',
  'Pharmacy calculations',
]

/**
 * Account details.
 *
 * Saves through `PATCH /api/auth/profile`, which accepts an allow-list of
 * fields — email, password and onboarding state are not editable here.
 */
export function ProfilePage() {
  const { user, updateProfile } = useAuth()

  const [form, setForm] = useState<ProfileForm | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)

  // The session is restored asynchronously via /auth/me, so `user` is null on
  // first render. A `useState` initialiser only runs once and would leave the
  // form permanently empty — sync it when the user actually arrives.
  useEffect(() => {
    if (!user || form) return
    setForm({
      firstName: user.firstName,
      lastName: user.lastName,
      university: user.university,
      year: user.year,
      experience: user.experience,
      learningGoals: user.learningGoals,
    })
  }, [user, form])

  if (!user || !form) return <LoadingState message="preparing" />

  const set = <K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev))
    setSaved(false)
  }

  const toggleGoal = (goal: LearningGoal) =>
    set(
      'learningGoals',
      form.learningGoals.includes(goal)
        ? form.learningGoals.filter((g) => g !== goal)
        : [...form.learningGoals, goal],
    )

  const submit = async (event: FormEvent) => {
    event.preventDefault()

    const next: Record<string, string> = {}
    if (!form.firstName.trim()) next.firstName = 'First name is required.'
    if (!form.lastName.trim()) next.lastName = 'Last name is required.'
    if (!form.university.trim()) next.university = 'University is required.'
    setErrors(next)
    if (Object.keys(next).length > 0) return

    setBusy(true)
    setSaved(false)
    try {
      await updateProfile({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        university: form.university.trim(),
        year: form.year,
        experience: form.experience,
        learningGoals: form.learningGoals,
      })
      setSaved(true)
    } catch (error) {
      setErrors({
        firstName:
          error instanceof ApiError ? error.userMessage : 'We couldn’t save your profile just now.',
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Profile" subtitle="Your account details and what you want to practise." />

      <header className="flex flex-wrap items-center gap-4 rounded-2xl border border-beige bg-cream-light p-5 shadow-soft sm:p-6">
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-sage-100 text-base font-semibold text-forest">
          {initials(user.firstName, user.lastName)}
        </span>
        <div className="min-w-0">
          <p className="font-display text-lg text-forest">
            {user.firstName} {user.lastName}
          </p>
          <p className="truncate text-sm text-ink-muted">{user.email}</p>
          <p className="mt-0.5 text-[11px] text-ink-muted">
            Joined {formatDate(user.joinedAt)}
          </p>
        </div>
        <div className="ml-auto flex flex-wrap gap-1.5">
          <Badge tone="neutral">{user.year}</Badge>
          <Badge tone="sage">{user.experience}</Badge>
        </div>
      </header>

      <form onSubmit={submit} className="space-y-4" noValidate>
        <section className="rounded-2xl border border-beige bg-cream-light p-5 shadow-soft sm:p-6">
          <h2 className="font-display text-lg text-forest">Your details</h2>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Input
              label="First name"
              value={form.firstName}
              onChange={(event) => set('firstName', event.target.value)}
              error={errors.firstName}
              autoComplete="given-name"
            />
            <Input
              label="Last name"
              value={form.lastName}
              onChange={(event) => set('lastName', event.target.value)}
              error={errors.lastName}
              autoComplete="family-name"
            />
          </div>

          <Input
            label="University"
            className="mt-4"
            value={form.university}
            onChange={(event) => set('university', event.target.value)}
            error={errors.university}
          />

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Select
              label="Year of study"
              value={form.year}
              onChange={(event) => set('year', event.target.value as YearOfStudy)}
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </Select>
            <Select
              label="Experience level"
              hint="Sets the starting difficulty of your cases."
              value={form.experience}
              onChange={(event) => set('experience', event.target.value as ExperienceLevel)}
            >
              {experiences.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </Select>
          </div>

          <p className="mt-4 text-[11px] text-ink-muted">
            Your email address cannot be changed here.
          </p>
        </section>

        <section className="rounded-2xl border border-beige bg-cream-light p-5 shadow-soft sm:p-6">
          <h2 className="font-display text-lg text-forest">Learning goals</h2>
          <p className="mt-1 text-sm text-ink-muted">
            What you pick here shapes which cases are suggested to you.
          </p>

          <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
            {goals.map((goal) => {
              const active = form.learningGoals.includes(goal)
              return (
                <button
                  key={goal}
                  type="button"
                  onClick={() => toggleGoal(goal)}
                  aria-pressed={active}
                  className={cn(
                    'flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-colors',
                    active
                      ? 'border-moss bg-sage-100 font-medium text-forest'
                      : 'border-beige-dark bg-cream text-ink hover:border-sage',
                  )}
                >
                  {goal}
                  <span
                    className={cn(
                      'grid h-5 w-5 shrink-0 place-items-center rounded-full border',
                      active ? 'border-moss bg-moss text-cream-light' : 'border-beige-dark',
                    )}
                    aria-hidden
                  >
                    {active && <Check className="h-3 w-3" strokeWidth={3} />}
                  </span>
                </button>
              )
            })}
          </div>
        </section>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={busy}>
            {busy ? 'Saving…' : 'Save changes'}
          </Button>
          {saved && (
            <span role="status" className="inline-flex items-center gap-1.5 text-sm text-moss-600">
              <Check className="h-4 w-4" strokeWidth={2.4} />
              Saved
            </span>
          )}
        </div>
      </form>
    </div>
  )
}
