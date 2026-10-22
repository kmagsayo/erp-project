import { Button } from '@/components/ui/button'
import type { PurchaseOrder } from '@/data/purchaseOrderTypes'
import { X } from 'lucide-react'
import { useEffect, useId, useRef } from 'react'

interface CreateReceivingFromPoDialogProps {
  open: boolean
  purchaseOrders: PurchaseOrder[]
  selectedPoId: string
  message: string | null
  onSelectedPoIdChange: (poId: string) => void
  onConfirm: () => void
  onClose: () => void
}

export function CreateReceivingFromPoDialog({
  open,
  purchaseOrders,
  selectedPoId,
  message,
  onSelectedPoIdChange,
  onConfirm,
  onClose,
}: CreateReceivingFromPoDialogProps) {
  const titleId = useId()
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeButtonRef.current?.focus()

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-lg rounded-xl border border-border bg-surface shadow-lg"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div>
            <h2 id={titleId} className="text-lg font-semibold text-text-primary">
              New Receiving
            </h2>
            <p className="mt-1 text-sm text-text-secondary">
              Create a receiving from an approved Purchase Order.
            </p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="rounded-md p-2 text-text-secondary hover:bg-maroon-light hover:text-maroon"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary">
              Purchase Order
            </label>
            <select
              value={selectedPoId}
              onChange={(event) => onSelectedPoIdChange(event.target.value)}
              className="h-10 w-full rounded-md border border-border-input bg-surface px-3 text-sm"
            >
              <option value="">Select approved PO</option>
              {purchaseOrders.map((po) => (
                <option key={po.id} value={po.id}>
                  {po.poNo} - {po.supplier}
                </option>
              ))}
            </select>
          </div>
          {message ? <p className="text-sm text-text-secondary">{message}</p> : null}
        </div>

        <div className="flex justify-end gap-2 border-t border-border px-5 py-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={onConfirm}>
            Create Receiving
          </Button>
        </div>
      </div>
    </div>
  )
}
