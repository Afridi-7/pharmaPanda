import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import type { ExperienceLevel, LearningGoal } from '@/types'
import { Button } from '@/components/ui/Button'
import { Progress } from '@/components/ui/Badge'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

const goals: LearningGoal[] = [
  'Clinical reasoning',
  'Patient counseling',
  'Medication safety',
  'History taking',
  'Pharmacy calculations',
]

const levels: { level: ExperienceLevel; blurb: string }[] = [
  { level: 'Beginner', blurb: 'I have had little or no patient-facing practice yet.' },
  { level: 'Intermediate', blurb: 'I have done some placements and structured consultations.' },
  { level: 'Advanced', blurb: 'I consult confidently and want harder, edge-case patients.' },
]

export function OnboardingPage() {
  const navigate = useNavigate()
  const { completeOnboarding, user } = useAuth()
  const [step, setStep] = useState(0)
  const [selected, setSelected] = useState<LearningGoal[]>(user?.learningGoals ?? [])
  const [experience, setExperience] = useState<ExperienceLevel>(user?.experience ?? 'Intermediate')
  const [busy, setBusy] = useState(false)

  const toggle = (goal: LearningGoal) =>
    setSelected((prev) => (prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]))

  const finish = async () => {
    setBusy(true)
    try {
      await completeOnboarding(selected, experience)
      navigate('/dashboard')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col justify-center px-5 py-12">
      <div className="mb-7">
        <div className="mb-2 flex items-center justify-between text-xs text-ink-muted">
          <span>Step {step + 1} of 3</span>
          <span>{['Your goals', 'Your experience', 'Ready'][step]}</span>
        </div>
        <Progress value={((step + 1) / 3) * 100} size="sm" label="Onboarding progress" />
      </div>

      <motion.div
        key={step}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28 }}
        className="rounded-2xl border border-beige bg-cream-light p-6 shadow-soft sm:p-8"
      >
        {step === 0 && (
          <>
            <h1 className="font-display text-2xl text-forest">What do you want to get better at?</h1>
            <p className="mt-2 text-sm text-ink-muted">Pick as many as apply. You can change these later.</p>
            <div className="mt-6 grid gap-2.5 sm:grid-cols-2">
              {goals.map((goal) => {
                const active = selected.includes(goal)
                return (
                  <button
                    key={goal}
                    type="button"
                    onClick={() => toggle(goal)}
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
          </>
        )}

        {step === 1 && (
          <>
            <h1 className="font-display text-2xl text-forest">How much consultation experience do you have?</h1>
            <p className="mt-2 text-sm text-ink-muted">This sets the starting difficulty of your patients.</p>
            <div className="mt-6 space-y-2.5">
              {levels.map((item) => {
                const active = experience === item.level
                return (
                  <button
                    key={item.level}
                    type="button"
                    onClick={() => setExperience(item.level)}
                    aria-pressed={active}
                    className={cn(
                      'w-full rounded-xl border px-4 py-3.5 text-left transition-colors',
                      active ? 'border-moss bg-sage-100' : 'border-beige-dark bg-cream hover:border-sage',
                    )}
                  >
                    <p className={cn('text-sm', active ? 'font-medium text-forest' : 'text-forest')}>{item.level}</p>
                    <p className="mt-0.5 text-xs text-ink-muted">{item.blurb}</p>
                  </button>
                )
              })}
            </div>
          </>
        )}

        {step === 2 && (
          <div className="text-center">
            
            <h1 className="font-display text-2xl text-forest">Setup complete</h1>
            <p className="mt-2 text-sm text-ink-muted">Case difficulty adjusts as your scores change.</p>
            <div className="mx-auto mt-6 max-w-sm rounded-xl border border-beige bg-cream px-4 py-3.5 text-left text-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-muted">Your focus</p>
              <p className="mt-1 text-ink">
                {selected.length > 0 ? selected.join(' · ') : 'Everything — we will start broad.'}
              </p>
              <p className="mt-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-muted">Level</p>
              <p className="mt-1 text-ink">{experience}</p>
            </div>
          </div>
        )}

        <div className="mt-8 flex items-center justify-between gap-3">
          <Button
            variant="quiet"
            onClick={() => setStep((prev) => Math.max(0, prev - 1))}
            disabled={step === 0 || busy}
          >
            Back
          </Button>
          {step < 2 ? (
            <Button onClick={() => setStep((prev) => prev + 1)} disabled={step === 0 && selected.length === 0}>
              Continue
            </Button>
          ) : (
            <Button variant="moss" onClick={finish} disabled={busy}>
              {busy ? 'Saving…' : 'Finish setup'}
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  )
}
