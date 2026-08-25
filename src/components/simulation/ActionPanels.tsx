import { useState, type FormEvent } from 'react'
import { HelpCircle, Mic, MessageSquare, PenLine, Send, Stethoscope, CheckCircle2 } from 'lucide-react'
import type { RecommendationOption, ReferralOption } from '@/types'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Field'
import { cn } from '@/lib/utils'

export type ConsultationMode = 'ask' | 'recommend' | 'counsel' | 'refer'

const modeButtons: { mode: ConsultationMode; label: string; icon: typeof HelpCircle }[] = [
  { mode: 'ask', label: 'Ask Question', icon: HelpCircle },
  { mode: 'recommend', label: 'Recommend', icon: Stethoscope },
  { mode: 'counsel', label: 'Counsel', icon: MessageSquare },
  { mode: 'refer', label: 'Refer', icon: PenLine },
]

interface ActionBarProps {
  mode: ConsultationMode
  onMode: (mode: ConsultationMode) => void
  onFinish: () => void
  done: { recommend: boolean; counsel: boolean; refer: boolean }
}

export function ActionBar({ mode, onMode, onFinish, done }: ActionBarProps) {
  return (
    <div className="flex items-center gap-2 border-t border-beige bg-cream px-4 py-2 sm:flex-wrap sm:px-5 sm:py-2.5">
      <div className="flex flex-1 items-center gap-2 overflow-x-auto scroll-slim sm:flex-none sm:overflow-visible">
      {modeButtons.map((item) => {
        const active = mode === item.mode
        const complete = item.mode !== 'ask' && done[item.mode as 'recommend' | 'counsel' | 'refer']
        return (
          <button
            key={item.mode}
            type="button"
            onClick={() => onMode(item.mode)}
            aria-pressed={active}
            className={cn(
              'inline-flex shrink-0 items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-[13px] font-medium transition-colors sm:px-3',
              active
                ? 'border-forest bg-forest text-cream-light'
                : 'border-beige-dark bg-cream-light text-forest hover:border-sage',
            )}
          >
            <item.icon className="h-4 w-4 shrink-0" strokeWidth={1.9} />
            <span className="whitespace-nowrap">{item.label}</span>
            {complete && <CheckCircle2 className="h-3.5 w-3.5 text-moss" strokeWidth={2.2} />}
          </button>
        )
      })}
      </div>
      {/* Always reachable: never pushed off-screen by the mode buttons. */}
      <Button variant="moss" size="sm" onClick={onFinish} className="shrink-0 sm:ml-auto">
        <span className="sm:hidden">Finish</span>
        <span className="hidden sm:inline">Finish Consultation</span>
      </Button>
    </div>
  )
}

interface AskBarProps {
  onAsk: (question: string) => void
  busy: boolean
}

export function AskBar({ onAsk, busy }: AskBarProps) {
  const [value, setValue] = useState('')
  const [listening, setListening] = useState(false)

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const question = value.trim()
    if (!question || busy) return
    onAsk(question)
    setValue('')
  }

  return (
    <form onSubmit={submit} className="border-t border-beige bg-cream-light px-4 py-3 sm:px-5">
      <div className="flex items-end gap-2">
        <label htmlFor="ask-input" className="sr-only">
          Ask the patient something
        </label>
        <input
          id="ask-input"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Ask the patient something…"
          autoComplete="off"
          className="h-11 w-full rounded-xl border border-beige-dark bg-cream px-3.5 text-sm text-ink placeholder:text-ink-muted/70 focus:border-moss focus:outline-none focus:ring-2 focus:ring-moss/30"
        />
        <Button
          type="button"
          variant="secondary"
          size="icon"
          aria-label={listening ? 'Stop voice input' : 'Use voice input'}
          aria-pressed={listening}
          onClick={() => setListening((prev) => !prev)}
          className={cn('shrink-0', listening && 'border-terracotta text-terracotta-600')}
        >
          <Mic className="h-4.5 w-4.5" strokeWidth={1.9} />
        </Button>
        <Button type="submit" size="icon" disabled={busy || value.trim().length === 0} className="shrink-0" aria-label="Send question">
          <Send className="h-4.5 w-4.5" strokeWidth={1.9} />
        </Button>
      </div>
      {listening && (
        <p className="mt-2 text-[11px] text-ink-muted">
          Voice input is not enabled. Type your question to continue.
        </p>
      )}
    </form>
  )
}

const recommendationOptions: RecommendationOption[] = [
  'Paracetamol',
  'NSAID',
  'Non-drug management',
  'No OTC treatment',
  'Routine physician referral',
  'Urgent referral',
  'Other',
]

interface RecommendPanelProps {
  onSubmit: (choice: RecommendationOption, reasoning: string) => void
  busy: boolean
  current?: { choice: RecommendationOption; reasoning: string }
}

export function RecommendPanel({ onSubmit, busy, current }: RecommendPanelProps) {
  const [choice, setChoice] = useState<RecommendationOption | null>(current?.choice ?? null)
  const [why, setWhy] = useState(current?.reasoning ?? '')

  return (
    <div className="border-t border-beige bg-cream-light px-4 py-4 sm:px-5">
      <h3 className="font-display text-[15px] text-forest">Your recommendation</h3>
      <fieldset className="mt-3">
        <legend className="sr-only">Choose a recommendation</legend>
        <div className="flex flex-wrap gap-2">
          {recommendationOptions.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setChoice(option)}
              aria-pressed={choice === option}
              className={cn(
                'rounded-xl border px-3 py-1.5 text-[13px] transition-colors',
                choice === option
                  ? 'border-moss bg-sage-100 font-medium text-forest'
                  : 'border-beige-dark bg-cream text-ink hover:border-sage',
              )}
            >
              {option}
            </button>
          ))}
        </div>
      </fieldset>
      <div className="mt-3">
        <Textarea
          label="Why?"
          value={why}
          onChange={(event) => setWhy(event.target.value)}
          placeholder="Explain the clinical reasoning behind your choice…"
          hint="Your reasoning is assessed, not just the option you pick."
        />
      </div>
      <Button
        className="mt-3"
        disabled={!choice || why.trim().length < 5 || busy}
        onClick={() => choice && onSubmit(choice, why.trim())}
      >
        Submit Recommendation
      </Button>
    </div>
  )
}

interface CounselPanelProps {
  onSubmit: (script: string) => void
  busy: boolean
  current?: string
}

export function CounselPanel({ onSubmit, busy, current }: CounselPanelProps) {
  const [script, setScript] = useState(current ?? '')
  return (
    <div className="border-t border-beige bg-cream-light px-4 py-4 sm:px-5">
      <h3 className="font-display text-[15px] text-forest">Counsel the Patient</h3>
      <Textarea
        className="mt-3"
        value={script}
        onChange={(event) => setScript(event.target.value)}
        placeholder="Explain the recommendation to the patient…"
        hint="Plain language, dose, how long to use it, and when to come back."
      />
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button disabled={script.trim().length < 10 || busy} onClick={() => onSubmit(script.trim())}>
          Submit Counseling
        </Button>
        <Button variant="secondary" type="button" onClick={() => undefined} aria-label="Speak counseling aloud">
          <Mic className="h-4 w-4" strokeWidth={1.9} />
          Speak
        </Button>
      </div>
    </div>
  )
}

const referralOptions: ReferralOption[] = [
  'No referral',
  'Routine physician referral',
  'Urgent referral',
  'Emergency referral',
]

interface ReferPanelProps {
  onSubmit: (choice: ReferralOption, reasoning: string) => void
  busy: boolean
  current?: { choice: ReferralOption; reasoning: string }
}

export function ReferPanel({ onSubmit, busy, current }: ReferPanelProps) {
  const [choice, setChoice] = useState<ReferralOption | null>(current?.choice ?? null)
  const [why, setWhy] = useState(current?.reasoning ?? '')
  return (
    <div className="border-t border-beige bg-cream-light px-4 py-4 sm:px-5">
      <h3 className="font-display text-[15px] text-forest">Referral decision</h3>
      <fieldset className="mt-3">
        <legend className="sr-only">Choose a referral level</legend>
        <div className="flex flex-wrap gap-2">
          {referralOptions.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setChoice(option)}
              aria-pressed={choice === option}
              className={cn(
                'rounded-xl border px-3 py-1.5 text-[13px] transition-colors',
                choice === option
                  ? 'border-moss bg-sage-100 font-medium text-forest'
                  : 'border-beige-dark bg-cream text-ink hover:border-sage',
              )}
            >
              {option}
            </button>
          ))}
        </div>
      </fieldset>
      <Textarea
        className="mt-3"
        label="Reasoning"
        value={why}
        onChange={(event) => setWhy(event.target.value)}
        placeholder="What are you referring for, and how urgently?"
      />
      <Button
        className="mt-3"
        disabled={!choice || why.trim().length < 5 || busy}
        onClick={() => choice && onSubmit(choice, why.trim())}
      >
        Record Referral Decision
      </Button>
    </div>
  )
}
