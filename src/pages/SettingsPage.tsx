import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Field'
import { Modal } from '@/components/ui/Modal'
import { Switch } from '@/components/ui/Switch'
import { CardSkeletonGrid, ErrorState, PageHeader } from '@/components/common/States'
import { useAsync } from '@/hooks/useAsync'
import { useAuth } from '@/hooks/useAuth'
import { settingsService, type AppSettings } from '@/services/settingsService'

const difficulties: AppSettings['caseDifficulty'][] = [
  'Adaptive',
  'Beginner',
  'Intermediate',
  'Advanced',
]
const depths: AppSettings['feedbackDepth'][] = ['Detailed', 'Concise']

/**
 * Practice preferences.
 *
 * These are per-device choices stored locally, not account data — the page says
 * so plainly rather than implying they follow the user around.
 */
export function SettingsPage() {
  const navigate = useNavigate()
  const { signOut } = useAuth()
  const { data, loading, error, reload } = useAsync(() => settingsService.get(), [])

  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [saved, setSaved] = useState(false)
  const [signOutOpen, setSignOutOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  useEffect(() => {
    if (data) setSettings(data)
  }, [data])

  const update = useCallback(async (patch: Partial<AppSettings>) => {
    const next = await settingsService.update(patch)
    setSettings(next)
    setSaved(true)
    window.setTimeout(() => setSaved(false), 1800)
  }, [])

  const confirmSignOut = async () => {
    setSigningOut(true)
    try {
      await signOut()
      navigate('/login')
    } finally {
      setSigningOut(false)
    }
  }

  if (loading || !settings) {
    if (error) return <ErrorState message={error} onRetry={reload} />
    return <CardSkeletonGrid count={3} />
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        subtitle="Practice preferences for this device."
        actions={
          saved ? (
            <span role="status" className="inline-flex items-center gap-1.5 text-sm text-moss-600">
              <Check className="h-4 w-4" strokeWidth={2.4} />
              Saved
            </span>
          ) : undefined
        }
      />

      <section className="rounded-2xl border border-beige bg-cream-light p-5 shadow-soft sm:p-6">
        <h2 className="font-display text-lg text-forest">Practice</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Select
            label="Case difficulty"
            hint="Adaptive follows your competency scores."
            value={settings.caseDifficulty}
            onChange={(event) =>
              void update({ caseDifficulty: event.target.value as AppSettings['caseDifficulty'] })
            }
          >
            {difficulties.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </Select>
          <Select
            label="Feedback depth"
            hint="How much detail appears on a consultation report."
            value={settings.feedbackDepth}
            onChange={(event) =>
              void update({ feedbackDepth: event.target.value as AppSettings['feedbackDepth'] })
            }
          >
            {depths.map((depth) => (
              <option key={depth} value={depth}>
                {depth}
              </option>
            ))}
          </Select>
        </div>

        <div className="mt-5 space-y-4 border-t border-beige pt-4">
          <Switch
            label="Show hints"
            description="Surface a nudge when a consultation stalls."
            checked={settings.showHints}
            onChange={(value) => void update({ showHints: value })}
          />
          <Switch
            label="Sound effects"
            description="Audio cues when a patient responds."
            checked={settings.soundEffects}
            onChange={(value) => void update({ soundEffects: value })}
          />
          <Switch
            label="Reduced motion"
            description="Minimise animation across the interface."
            checked={settings.reducedMotion}
            onChange={(value) => void update({ reducedMotion: value })}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-beige bg-cream-light p-5 shadow-soft sm:p-6">
        <h2 className="font-display text-lg text-forest">Notifications</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Email delivery is not connected yet — these preferences are stored for when it is.
        </p>
        <div className="mt-4 space-y-4">
          <Switch
            label="Practice reminders"
            description="A nudge when you have not practised for a few days."
            checked={settings.practiceReminders}
            onChange={(value) => void update({ practiceReminders: value })}
          />
          <Switch
            label="Weekly summary"
            description="A digest of your competency movement each week."
            checked={settings.emailDigest}
            onChange={(value) => void update({ emailDigest: value })}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-beige bg-cream-light p-5 shadow-soft sm:p-6">
        <h2 className="font-display text-lg text-forest">Account</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Your consultations and scores are stored against your account, so they are available
          wherever you sign in.
        </p>
        <Button variant="secondary" className="mt-4" onClick={() => setSignOutOpen(true)}>
          <LogOut className="h-4 w-4" strokeWidth={1.9} />
          Sign out
        </Button>
      </section>

      <Modal
        open={signOutOpen}
        onClose={() => setSignOutOpen(false)}
        title="Sign out?"
        description="Your consultations and scores stay saved to your account."
        footer={
          <>
            <Button variant="secondary" onClick={() => setSignOutOpen(false)} disabled={signingOut}>
              Cancel
            </Button>
            <Button variant="moss" onClick={confirmSignOut} disabled={signingOut}>
              {signingOut ? 'Signing out…' : 'Sign out'}
            </Button>
          </>
        }
      />
    </div>
  )
}
