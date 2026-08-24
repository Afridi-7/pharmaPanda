import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Info } from 'lucide-react'
import type { ConversationMessage, Patient } from '@/types'
import { PatientAvatar } from '@/components/brand/PatientAvatar'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'

const toneCopy: Record<NonNullable<ConversationMessage['tone']>, string | null> = {
  neutral: null,
  concerned: 'Concerned',
  confused: 'Looks confused',
  reassured: 'Reassured',
  impatient: 'Getting impatient',
}

export function PatientHeader({ patient }: { patient: Patient }) {
  return (
    <div className="flex items-center gap-3 border-b border-beige bg-cream-light px-4 py-3 sm:px-5">
      <PatientAvatar avatar={patient.avatar} name={patient.name} size={48} />
      <div className="min-w-0">
        <p className="truncate font-display text-[15px] text-forest">
          {patient.name}, {patient.age}
        </p>
        <p className="truncate text-xs text-ink-muted">
          {patient.role} · {patient.pronouns}
        </p>
      </div>
      <Badge tone={patient.mood === 'calm' ? 'sage' : patient.mood === 'impatient' ? 'terracotta' : 'honey'} className="ml-auto capitalize">
        {patient.mood}
      </Badge>
    </div>
  )
}

interface ThreadProps {
  patient: Patient
  messages: ConversationMessage[]
  thinking: boolean
  className?: string
}

/**
 * The consultation transcript. Styled as a pharmacy counter exchange — the
 * patient speaks from a warm card with their portrait, the student's turns sit
 * on the right in forest green, and system notes are quiet inline observations.
 */
export function ConversationThread({ patient, messages, thinking, className }: ThreadProps) {
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages.length, thinking])

  return (
    <div className={cn('flex-1 space-y-4 overflow-y-auto scroll-slim px-4 py-5 sm:px-5', className)} aria-live="polite">
      {messages.map((message) => {
        if (message.author === 'system') {
          return (
            <div key={message.id} className="mx-auto flex max-w-xl items-start gap-2 rounded-xl border border-beige bg-cream px-3 py-2">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-muted" strokeWidth={2} />
              <p className="text-xs leading-relaxed text-ink-muted">{message.text}</p>
            </div>
          )
        }
        const isStudent = message.author === 'student'
        const tone = message.tone ? toneCopy[message.tone] : null
        return (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.24 }}
            className={cn('flex items-start gap-2.5', isStudent && 'flex-row-reverse')}
          >
            {isStudent ? (
              <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-sage-100 text-[10px] font-semibold text-forest">
                YOU
              </span>
            ) : (
              <PatientAvatar avatar={patient.avatar} name={patient.name} size={32} className="mt-0.5" />
            )}
            <div className={cn('max-w-[82%] sm:max-w-[72%]', isStudent && 'text-right')}>
              <p className="mb-1 text-[11px] font-medium uppercase tracking-[0.08em] text-ink-muted">
                {isStudent ? 'You' : patient.name.split(' ')[0]}
                {tone && !isStudent && <span className="ml-2 normal-case tracking-normal text-terracotta-600">{tone}</span>}
              </p>
              <div
                className={cn(
                  'rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                  isStudent
                    ? 'rounded-tr-md bg-forest text-cream-light'
                    : 'rounded-tl-md border border-beige bg-cream-light text-ink shadow-soft',
                )}
              >
                {message.text}
              </div>
            </div>
          </motion.div>
        )
      })}

      {thinking && (
        <div className="flex items-start gap-2.5">
          <PatientAvatar avatar={patient.avatar} name={patient.name} size={32} className="mt-0.5" />
          <div className="rounded-2xl rounded-tl-md border border-beige bg-cream-light px-4 py-3 shadow-soft">
            <span className="sr-only">Your patient is thinking…</span>
            <span className="flex gap-1.5" aria-hidden>
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="h-1.5 w-1.5 rounded-full bg-sage motion-safe:animate-soft-pulse"
                  style={{ animationDelay: `${i * 150}ms` }}
                />
              ))}
            </span>
          </div>
        </div>
      )}
      <div ref={endRef} />
    </div>
  )
}
