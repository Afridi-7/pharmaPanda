import { useEffect, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children?: ReactNode
  footer?: ReactNode
  /** Bottom sheet on mobile, centred dialog from `sm` upwards. */
  variant?: 'dialog' | 'sheet'
  className?: string
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  variant = 'dialog',
  className,
}: ModalProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
    }
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="presentation">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="absolute inset-0 bg-forest-900/35 backdrop-blur-[2px]"
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ opacity: 0, y: variant === 'sheet' ? 40 : 12, scale: variant === 'sheet' ? 1 : 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: variant === 'sheet' ? 40 : 8, scale: 0.99 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className={cn(
              'relative z-10 w-full max-h-[92vh] overflow-y-auto scroll-slim border border-beige bg-cream-light shadow-lift',
              variant === 'sheet'
                ? 'rounded-t-3xl sm:max-w-lg sm:rounded-3xl'
                : 'rounded-t-3xl sm:max-w-lg sm:rounded-3xl',
              className,
            )}
          >
            <div className="flex items-start justify-between gap-4 border-b border-beige px-5 py-4 sm:px-6">
              <div>
                <h2 className="font-display text-lg text-forest">{title}</h2>
                {description && <p className="mt-1 text-sm text-ink-muted">{description}</p>}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="-mr-1 rounded-lg p-1.5 text-ink-muted transition-colors hover:bg-beige/60 hover:text-forest"
              >
                <X className="h-4.5 w-4.5" strokeWidth={1.8} />
              </button>
            </div>
            {children && <div className="px-5 py-5 sm:px-6">{children}</div>}
            {footer && (
              <div className="flex flex-col-reverse gap-2 border-t border-beige px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
