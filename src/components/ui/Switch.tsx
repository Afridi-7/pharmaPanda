import { cn } from '@/lib/utils'

interface SwitchProps {
  checked: boolean
  onChange: (next: boolean) => void
  label: string
  description?: string
  disabled?: boolean
  className?: string
}

/** Accessible toggle: state is announced, not colour-only — the knob position and text both change. */
export function Switch({ checked, onChange, label, description, disabled, className }: SwitchProps) {
  return (
    <div className={cn('flex items-start justify-between gap-4', className)}>
      <div className="min-w-0">
        <p className="text-sm font-medium text-forest">{label}</p>
        {description && <p className="mt-0.5 text-xs text-ink-muted">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative mt-0.5 h-6 w-11 shrink-0 rounded-full border transition-colors disabled:opacity-55',
          checked ? 'border-moss-600 bg-moss' : 'border-beige-dark bg-beige',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-4.5 w-4.5 rounded-full bg-cream-light shadow-soft transition-all duration-200',
            checked ? 'left-[1.4rem]' : 'left-0.5',
          )}
        />
      </button>
    </div>
  )
}

interface TabsProps<T extends string> {
  tabs: { value: T; label: string; count?: number }[]
  value: T
  onChange: (next: T) => void
  className?: string
}

export function Tabs<T extends string>({ tabs, value, onChange, className }: TabsProps<T>) {
  return (
    <div role="tablist" className={cn('flex flex-wrap gap-1 rounded-xl border border-beige bg-cream p-1', className)}>
      {tabs.map((tab) => {
        const active = tab.value === value
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.value)}
            className={cn(
              'rounded-lg px-3.5 py-1.5 text-[13px] font-medium transition-colors',
              active ? 'bg-cream-light text-forest shadow-soft' : 'text-ink-muted hover:text-forest',
            )}
          >
            {tab.label}
            {tab.count !== undefined && <span className="ml-1.5 text-ink-muted/80">{tab.count}</span>}
          </button>
        )
      })}
    </div>
  )
}
