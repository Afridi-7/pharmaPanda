import { cn } from '@/lib/utils'

interface MarkProps {
  size?: number
  className?: string
  /** Kept for call-site compatibility; the mark itself does not emote. */
  state?: 'idle' | 'supportive' | 'thinking' | 'attentive'
}

/**
 * PharmaPanda logomark.
 *
 * An abstract two-tone form: the dark arcs read as ears, the light field as a
 * face, and the negative space holds a pharmacy cross. No eyes, no mouth — it
 * is a mark, not a character, so it can sit next to the wordmark without
 * turning the product into a cartoon.
 */
export function PandaMark({ size = 32, className, state }: MarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      role="img"
      aria-label="PharmaPanda"
      className={cn(state === 'thinking' && 'motion-safe:animate-soft-pulse', className)}
    >
      <circle cx="13" cy="13" r="8" fill="currentColor" />
      <circle cx="35" cy="13" r="8" fill="currentColor" />
      <rect x="6" y="16" width="36" height="26" rx="13" fill="currentColor" />
      <rect x="11" y="21" width="26" height="16" rx="8" className="fill-cream-light" />
      <rect x="20" y="27.6" width="8" height="2.8" rx="1.4" fill="currentColor" />
      <rect x="22.6" y="25" width="2.8" height="8" rx="1.4" fill="currentColor" />
    </svg>
  )
}

/**
 * @deprecated Use `PandaMark`. Retained so existing call sites keep compiling
 * while the illustrative mascot is phased out of the interface.
 */
export const PandaMascot = PandaMark

interface LogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  withWordmark?: boolean
}

export function Logo({ className, size = 'md', withWordmark = true }: LogoProps) {
  const mark = size === 'sm' ? 24 : size === 'lg' ? 36 : 28
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <PandaMark size={mark} className="text-forest" />
      {withWordmark && (
        <span
          className={cn(
            'font-display font-semibold tracking-tight text-forest',
            size === 'sm' ? 'text-base' : size === 'lg' ? 'text-2xl' : 'text-lg',
          )}
        >
          PharmaPanda
        </span>
      )}
    </span>
  )
}
