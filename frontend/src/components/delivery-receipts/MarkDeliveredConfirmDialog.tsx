import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

interface MarkDeliveredConfirmDialogProps {
  open: boolean
  onCancel: () => void
  onConfirm: () => void
}

export function MarkDeliveredConfirmDialog({
  open,
  onCancel,
  onConfirm,
}: MarkDeliveredConfirmDialogProps) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-transparent p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="mark-delivered-title"
        className="w-full max-w-md rounded-xl border border-border bg-surface shadow-lg"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 id="mark-delivered-title" className="text-lg font-semibold text-maroon">
            Mark as Delivered
          </h2>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close mark as delivered confirmation"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-text-secondary hover:bg-maroon-light hover:text-maroon"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="px-5 py-4 text-sm text-text-secondary">
          Mark this delivery as completed?
        </p>
        <div className="flex justify-end gap-3 border-t border-border px-5 py-4">
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="button" onClick={onConfirm}>
            Confirm
          </Button>
        </div>
      </div>
    </div>
  )
}
