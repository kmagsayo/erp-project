import { cn } from '@/lib/utils'
import { CheckCircle2, X } from 'lucide-react'

interface ToastProps {
  message: string
  onClose: () => void
  className?: string
}

export function Toast({ message, onClose, className }: ToastProps) {
  return (
    <div
      role="status"
      className={cn(
        'fixed inset-x-3 top-16 z-[80] flex max-w-sm items-center gap-3 rounded-md border border-[#A7F3D0] bg-[#D1FAE5] px-4 py-3 text-sm font-medium text-[#065F46] shadow-md sm:inset-x-auto sm:right-6',
        className,
      )}
    >
      <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span className="flex-1">{message}</span>
      <button
        type="button"
        onClick={onClose}
        className="rounded-md p-1 text-[#065F46]/80 hover:bg-white/50 hover:text-[#065F46]"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
