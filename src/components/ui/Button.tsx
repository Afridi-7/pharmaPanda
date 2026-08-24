import { forwardRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss focus-visible:ring-offset-2 focus-visible:ring-offset-cream-light',
  {
    variants: {
      variant: {
        primary: 'bg-forest text-cream-light shadow-soft hover:bg-forest-700 active:bg-forest-900',
        moss: 'bg-moss text-cream-light shadow-soft hover:bg-moss-600',
        secondary: 'border border-beige-dark bg-cream-light text-forest hover:bg-cream',
        ghost: 'text-forest hover:bg-beige/50',
        quiet: 'text-ink-muted hover:bg-beige/40 hover:text-forest',
        warning: 'bg-terracotta text-cream-light hover:bg-terracotta-600',
        danger: 'bg-alert text-cream-light hover:bg-alert/90',
        link: 'text-moss-600 underline-offset-4 hover:underline',
      },
      size: {
        sm: 'h-9 px-3.5 text-[13px]',
        md: 'h-11 px-5',
        lg: 'h-12 px-6 text-base',
        icon: 'h-10 w-10',
      },
      block: { true: 'w-full', false: '' },
    },
    defaultVariants: { variant: 'primary', size: 'md', block: false },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, block, type = 'button', ...props }, ref) => (
    <button ref={ref} type={type} className={cn(buttonVariants({ variant, size, block }), className)} {...props} />
  ),
)
Button.displayName = 'Button'

export { buttonVariants }
