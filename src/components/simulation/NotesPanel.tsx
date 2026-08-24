import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Check, NotebookPen } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { cn } from '@/lib/utils'

interface NotesPanelProps {
  value: string
  onChange: (next: string) => void
  className?: string
  collapsible?: boolean
}

/** Notes persist for the whole attempt and are credited in the evaluation. */
export function NotesPanel({ value, onChange, className, collapsible = false }: NotesPanelProps) {
  const [open, setOpen] = useState(!collapsible)
  return (
    <div className={cn('rounded-2xl border border-beige bg-cream-light', className)}>
      <div className="flex items-center justify-between gap-2 border-b border-beige px-4 py-3">
        <h2 className="inline-flex items-center gap-2 font-display text-[15px] text-forest">
          <NotebookPen className="h-4 w-4 text-sage" strokeWidth={1.9} />
          Your Notes
        </h2>
        {collapsible && (
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            aria-expanded={open}
            className="text-xs font-medium text-moss-600 hover:underline"
          >
            {open ? 'Hide' : 'Show'}
          </button>
        )}
      </div>
      {open && (
        <div className="px-4 py-3">
          <label htmlFor="attempt-notes" className="sr-only">
            Your notes
          </label>
          <textarea
            id="attempt-notes"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="Record important findings…"
            className="min-h-[160px] w-full resize-y rounded-xl border border-beige-dark bg-cream px-3 py-2.5 text-sm leading-relaxed text-ink placeholder:text-ink-muted/70 focus:border-moss focus:outline-none focus:ring-2 focus:ring-moss/30"
          />
          <p className="mt-1.5 text-[11px] text-ink-muted">Saved automatically as you type.</p>
        </div>
      )}
    </div>
  )
}

interface FinishModalProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  busy: boolean
  outstanding: string[]
}

export function FinishModal({ open, onClose, onConfirm, busy, outstanding }: FinishModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Finish consultation?"
      description="You won’t be able to change your answers after submitting."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Continue Consultation
          </Button>
          <Button variant="moss" onClick={onConfirm} disabled={busy}>
            {busy ? 'Submitting…' : 'Finish & Evaluate'}
          </Button>
        </>
      }
    >
      {outstanding.length > 0 ? (
        <div className="rounded-xl border border-honey-600/35 bg-honey-100/70 px-3.5 py-3">
          <p className="text-sm font-medium text-[#7A5C10]">Still open, if you want them:</p>
          <ul className="mt-1.5 space-y-1 text-sm text-ink">
            {outstanding.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-ink-muted">
            You can submit anyway — the evaluation reflects what you actually did.
          </p>
        </div>
      ) : (
        <p className="text-sm text-ink-muted">
          You have covered every objective. Submit when you are happy with your consultation.
        </p>
      )}
    </Modal>
  )
}

interface EvaluationLoadingProps {
  stages: string[]
  onDone: () => void
}

/** Six-stage review animation. Each stage lands, then the results page opens. */
export function EvaluationLoading({ stages, onDone }: EvaluationLoadingProps) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (index >= stages.length) {
      const finish = window.setTimeout(onDone, 420)
      return () => window.clearTimeout(finish)
    }
    const timer = window.setTimeout(() => setIndex((prev) => prev + 1), 420)
    return () => window.clearTimeout(timer)
  }, [index, stages.length, onDone])

  return (
    <div className="grid min-h-screen place-items-center bg-cream px-4">
      <div className="w-full max-w-md rounded-2xl border border-beige bg-cream-light p-6 shadow-lift" role="status" aria-live="polite">
        <div className="flex items-center gap-3">
          
          <div>
            <h1 className="font-display text-lg text-forest">Reviewing your consultation…</h1>
            <p className="text-sm text-ink-muted">Checking what you asked, and what you decided.</p>
          </div>
        </div>
        <ul className="mt-5 space-y-2">
          {stages.map((stage, i) => {
            const complete = i < index
            const active = i === index
            return (
              <motion.li
                key={stage}
                animate={{ opacity: complete || active ? 1 : 0.45 }}
                className="flex items-center gap-2.5 text-sm"
              >
                <span
                  className={cn(
                    'grid h-5 w-5 shrink-0 place-items-center rounded-full border transition-colors',
                    complete ? 'border-moss bg-moss text-cream-light' : 'border-beige-dark bg-cream',
                  )}
                  aria-hidden
                >
                  {complete ? (
                    <Check className="h-3 w-3" strokeWidth={3} />
                  ) : (
                    active && <span className="h-1.5 w-1.5 rounded-full bg-sage motion-safe:animate-soft-pulse" />
                  )}
                </span>
                <span className={complete ? 'text-forest' : 'text-ink'}>{stage}</span>
              </motion.li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
