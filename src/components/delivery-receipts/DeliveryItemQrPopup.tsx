import { DeliveryItemQr } from '@/components/ui/item-qr'
import type { DeliveryReceiptItem } from '@/data/erpTypes'
import { X } from 'lucide-react'
import { useEffect, useRef } from 'react'

export function DeliveryItemQrPopup({
  receiptId,
  item,
  onClose,
}: {
  receiptId: string
  item: DeliveryReceiptItem
  onClose: () => void
}) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const titleId = `delivery-item-qr-${item.id}`
  const received = item.allowedQuantity > 0 && item.quantity >= item.allowedQuantity

  useEffect(() => {
    closeRef.current?.focus()
  }, [item.id])

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
      role="presentation"
      onMouseDown={(event) => {
        event.stopPropagation()
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-sm rounded-xl border border-border bg-surface p-6 shadow-lg"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 id={titleId} className="text-lg font-semibold text-text-primary">
              {item.description}
            </h3>
            <p className="text-sm text-text-secondary">{item.itemCode}</p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close item QR"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-maroon-light hover:text-maroon"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex justify-center rounded-lg bg-white p-4">
          <DeliveryItemQr
            receiptId={receiptId}
            itemId={item.id}
            description={item.description}
            size={220}
          />
        </div>
        <p className="mt-4 text-center text-sm text-text-secondary">
          {received
            ? 'This item is received.'
            : 'Scan this QR with your phone. It is marked received on this screen.'}
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2 text-center text-sm">
          <div>
            <div className="text-text-secondary">Ordered</div>
            <div className="font-semibold text-text-primary">{item.allowedQuantity}</div>
          </div>
          <div>
            <div className="text-text-secondary">Received</div>
            <div className={`font-semibold ${received ? 'text-success-text' : 'text-text-primary'}`}>
              {item.quantity}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
