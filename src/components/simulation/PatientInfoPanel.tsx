import { AnimatePresence, motion } from 'framer-motion'
import { Check } from 'lucide-react'
import type { PatientFact } from '@/types'
import { cn } from '@/lib/utils'

const sections: { key: PatientFact['section']; label: string }[] = [
  { key: 'basic', label: 'Basic Information' },
  { key: 'symptoms', label: 'Symptoms' },
  { key: 'history', label: 'Medical History' },
  { key: 'allergies', label: 'Allergies' },
  { key: 'medications', label: 'Medications' },
  { key: 'other', label: 'Other Relevant Information' },
]

interface PatientInfoPanelProps {
  facts: PatientFact[]
  revealedIds: string[]
  /** Ids revealed by the most recent exchange — briefly flagged as discovered. */
  justRevealed: string[]
  className?: string
}

/**
 * Only what the student has actually uncovered appears here. Undiscovered facts
 * are absent entirely — no "unknown" placeholders that leak the question set.
 */
export function PatientInfoPanel({ facts, revealedIds, justRevealed, className }: PatientInfoPanelProps) {
  const revealed = facts.filter((fact) => revealedIds.includes(fact.id))

  return (
    <div className={cn('rounded-2xl border border-beige bg-cream-light', className)}>
      <div className="flex items-center justify-between gap-2 border-b border-beige px-4 py-3">
        <h2 className="font-display text-[15px] text-forest">Patient Information</h2>
        {/*
          Deliberately not "n of N" — a total would tell the student exactly how
          much they have left to find, which is the question the consultation is
          supposed to be asking them.
        */}
        <span className="text-[11px] text-ink-muted">
          {revealed.length} {revealed.length === 1 ? 'detail' : 'details'} discovered
        </span>
      </div>
      <div className="divide-y divide-beige/70">
        {sections.map((section) => {
          const items = revealed.filter((fact) => fact.section === section.key)
          if (items.length === 0) return null
          return (
            <div key={section.key} className="px-4 py-3">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-ink-muted">{section.label}</p>
              <dl className="mt-2 space-y-2">
                <AnimatePresence initial={false}>
                  {items.map((fact) => {
                    const fresh = justRevealed.includes(fact.id)
                    return (
                      <motion.div
                        key={fact.id}
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className={cn(
                          'rounded-xl border px-3 py-2 transition-colors',
                          fresh ? 'border-sage bg-sage-100/70' : 'border-transparent bg-cream',
                          fact.safetyCritical && 'border-terracotta/40 bg-terracotta-100/50',
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <dt className="text-[11px] font-medium uppercase tracking-[0.08em] text-ink-muted">
                            {fact.label}
                          </dt>
                          {fresh && (
                            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-forest px-1.5 py-0.5 text-[10px] font-medium text-cream-light">
                              New
                            </span>
                          )}
                        </div>
                        <dd className="mt-0.5 text-sm leading-snug text-ink">{fact.value}</dd>
                        {fact.safetyCritical && (
                          <p className="mt-1 text-[11px] font-medium text-terracotta-600">
                            Safety-relevant — factor this into your decision.
                          </p>
                        )}
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </dl>
            </div>
          )
        })}
      </div>
      <p className="border-t border-beige px-4 py-3 text-[11px] leading-relaxed text-ink-muted">
        Only information you have asked about appears here.
      </p>
    </div>
  )
}

interface ObjectivesPanelProps {
  objectives: { id: string; label: string; hint: string }[]
  met: string[]
  className?: string
}

export function ObjectivesPanel({ objectives, met, className }: ObjectivesPanelProps) {
  return (
    <div className={cn('rounded-2xl border border-beige bg-cream-light', className)}>
      <div className="border-b border-beige px-4 py-3">
        <h2 className="font-display text-[15px] text-forest">Consultation Objectives</h2>
        <p className="mt-0.5 text-[11px] text-ink-muted">
          {met.length} of {objectives.length} addressed
        </p>
      </div>
      <ul className="space-y-1.5 px-4 py-3">
        {objectives.map((objective) => {
          const done = met.includes(objective.id)
          return (
            <li key={objective.id} className="flex items-start gap-2.5">
              <span
                className={cn(
                  'mt-0.5 grid h-4.5 w-4.5 shrink-0 place-items-center rounded-full border',
                  done ? 'border-moss bg-moss text-cream-light' : 'border-beige-dark bg-cream',
                )}
                aria-hidden
              >
                {done && <Check className="h-3 w-3" strokeWidth={3} />}
              </span>
              <span>
                <span className={cn('block text-sm', done ? 'font-medium text-forest' : 'text-ink')}>
                  {objective.label}
                  <span className="sr-only">{done ? ' — addressed' : ' — not yet addressed'}</span>
                </span>
                <span className="block text-[11px] leading-snug text-ink-muted">{objective.hint}</span>
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
