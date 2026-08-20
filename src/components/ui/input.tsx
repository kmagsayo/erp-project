import { cn } from '@/lib/utils'
import { type InputHTMLAttributes, forwardRef } from 'react'

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type = 'text', ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        'flex h-9 w-full rounded-md border border-border-input bg-surface px-3 py-1 text-sm text-text-primary',
        'placeholder:text-text-secondary',
        'focus-visible:outline-none focus-visible:border-maroon focus-visible:ring-2 focus-visible:ring-maroon-light',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  ),
)
Input.displayName = 'Input'

export const Label = forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn('text-sm font-medium text-text-primary', className)}
      {...props}
    />
  ),
)
Label.displayName = 'Label'

export const FormField = ({
  label,
  children,
  className,
}: {
  label: string
  children: React.ReactNode
  className?: string
}) => (
  <div className={cn('space-y-1.5', className)}>
    <Label>{label}</Label>
    {children}
  </div>
)
