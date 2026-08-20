import { cn } from '@/lib/utils'
import { type HTMLAttributes } from 'react'

type BadgeVariant =
  | 'approved'
  | 'pending'
  | 'rejected'
  | 'draft'
  | 'released'
  | 'current'
  | 'default'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

const variantStyles: Record<BadgeVariant, string> = {
  approved: 'bg-[#DCFCE7] text-[#15803D]',
  pending: 'bg-[#FEF3C7] text-[#B45309]',
  rejected: 'bg-[#FEE2E2] text-[#DC2626]',
  draft: 'bg-draft text-text-secondary',
  released: 'bg-[#DBEAFE] text-[#1D4ED8]',
  current: 'bg-maroon-light text-maroon',
  default: 'bg-draft text-text-secondary',
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variantStyles[variant],
        className,
      )}
      {...props}
    />
  )
}
