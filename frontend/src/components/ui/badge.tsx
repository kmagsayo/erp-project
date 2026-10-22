import { cn } from '@/lib/utils'
import { type HTMLAttributes } from 'react'

type BadgeVariant =
  | 'approved'
  | 'pending'
  | 'rejected'
  | 'draft'
  | 'released'
  | 'completed'
  | 'cancelled'
  | 'current'
  | 'active'
  | 'out_for_delivery'
  | 'partially_delivered'
  | 'default'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

const variantStyles: Record<BadgeVariant, string> = {
  approved: 'bg-[#DCFCE7] text-[#15803D]',
  pending: 'bg-[#FEF3C7] text-[#B45309]',
  completed: 'bg-[#DCFCE7] text-[#15803D]',
  rejected: 'bg-[#FEE2E2] text-[#DC2626]',
  cancelled: 'bg-[#FEE2E2] text-[#B91C1C]',
  draft: 'bg-draft text-text-secondary',
  released: 'bg-maroon-light text-maroon',
  current: 'bg-maroon-light text-maroon',
  active: 'bg-[#DBEAFE] text-[#1D4ED8]',
  out_for_delivery: 'bg-[#FEF3C7] text-[#B45309]',
  partially_delivered: 'bg-[#FEF3C7] text-[#B45309]',
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
