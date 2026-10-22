import { Button } from '@/components/ui/button'
import type { DeliveryReceipt } from '@/data/erpTypes'
import { formatDrMoney, formatReceivedAt } from '@/lib/deliveryReceipts'
import { X } from 'lucide-react'
import { useEffect, useId, useRef } from 'react'

interface DeliveryReceiptDetailModalProps {
  receipt: DeliveryReceipt
  escapeDisabled?: boolean
  onClose: () => void
  onMarkOutForDelivery: () => void
  onRequestMarkDelivered: () => void
  onCreateBilling: () => void
}

export function DeliveryReceiptDetailModal({
  receipt,
  escapeDisabled = false,
  onClose,
  onMarkOutForDelivery,
  onRequestMarkDelivered,
  onCreateBilling,
}: DeliveryReceiptDetailModalProps) {
  const titleId = useId()
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeButtonRef.current?.focus()

    function handleKeyDown(event: KeyboardEvent) {
      if (escapeDisabled) return
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
  }, [escapeDisabled, onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-transparent p-3 sm:p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-lg rounded-xl border border-border bg-surface shadow-lg"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 id={titleId} className="text-lg font-semibold text-text-primary">
              Delivery Receipt Details
            </h2>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close delivery receipt details"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-text-secondary hover:bg-maroon-light hover:text-maroon"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-2 px-5 py-4 text-sm">
          <p className="text-lg font-semibold text-text-primary">{receipt.id}</p>
          <p>
            <span className="text-text-secondary">Customer: </span>
            <span className="text-text-primary">{receipt.customer || '—'}</span>
          </p>
          <p>
            <span className="text-text-secondary">Reference Outslip: </span>
            <span className="text-text-primary">{receipt.outslipId || '—'}</span>
          </p>
          <p>
            <span className="text-text-secondary">Total: </span>
            <span className="font-medium text-text-primary">
              {formatDrMoney(receipt.totalAmount)}
            </span>
          </p>
          {receipt.status === 'received' ? (
            <p>
              <span className="text-text-secondary">Received: </span>
              <span className="text-text-primary">
                {receipt.receivedBy || '—'}
                {receipt.receivedAt ? ` · ${formatReceivedAt(receipt.receivedAt)}` : ''}
              </span>
            </p>
          ) : null}
        </div>

        <div className="px-5 pb-5">
          {receipt.status === 'active' ? (
            <Button type="button" onClick={onMarkOutForDelivery}>
              Mark Out for Delivery
            </Button>
          ) : null}
          {receipt.status === 'out_for_delivery' ? (
            <Button type="button" onClick={onRequestMarkDelivered}>
              Mark as Delivered
            </Button>
          ) : null}
          {receipt.status === 'delivered' || receipt.status === 'received' ? (
            <Button type="button" onClick={onCreateBilling}>
              Create Billing
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
