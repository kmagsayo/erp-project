import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { GatePass } from '@/data/erpTypes'
import { catalogBrandAndModel, useCatalogItems } from '@/hooks/useCatalogItems'
import { gatePassStatusLabel } from '@/lib/gatePasses'
import { X } from 'lucide-react'
import { useEffect, useId, useRef } from 'react'

interface GatePassDetailModalProps {
  gatePass: GatePass
  message: string | null
  existingDeliveryReceiptId: string | null
  onClose: () => void
  onCreateDeliveryReceipt: () => void
  onViewDeliveryReceipt: (receiptId: string) => void
  onUpdateField: <K extends keyof GatePass>(key: K, value: GatePass[K]) => void
}

export function GatePassDetailModal({
  gatePass,
  message,
  existingDeliveryReceiptId,
  onClose,
  onCreateDeliveryReceipt,
  onViewDeliveryReceipt,
  onUpdateField,
}: GatePassDetailModalProps) {
  const titleId = useId()
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const catalogItems = useCatalogItems()

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeButtonRef.current?.focus()

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }

      if (event.key !== 'Tab' || !panelRef.current) return

      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )
      if (focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  const isCancelled = gatePass.status === 'cancelled'
  const canEdit = !isCancelled

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
        className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-lg"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <p id={titleId} className="text-sm font-medium text-text-secondary">
              Gate Pass Details
            </p>
            <h2 className="mt-1 flex flex-wrap items-center gap-2 truncate text-xl font-semibold text-text-primary">
              <span className="truncate">
                {gatePass.id}
                {gatePass.customer ? ` — ${gatePass.customer}` : ''}
              </span>
              <Badge variant={gatePass.status === 'cancelled' ? 'cancelled' : 'approved'}>
                {gatePassStatusLabel[gatePass.status]}
              </Badge>
            </h2>
            <p className="mt-1 text-sm text-text-secondary">Outslip: {gatePass.outslipId}</p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close gate pass details"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-maroon-light hover:text-maroon"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
          <section className="mb-6">
            <h3 className="mb-3 text-sm font-semibold text-text-primary">Header Information</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-text-secondary">
                  Gate Pass No
                </label>
                <Input value={gatePass.id} disabled readOnly />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-text-secondary">Date</label>
                <Input
                  type="date"
                  value={gatePass.date}
                  disabled={!canEdit}
                  onChange={(event) => onUpdateField('date', event.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-text-secondary">
                  Time Out
                </label>
                <Input
                  type="time"
                  value={gatePass.timeOut}
                  disabled={!canEdit}
                  onChange={(event) => onUpdateField('timeOut', event.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-text-secondary">
                  Outslip No
                </label>
                <Input value={gatePass.outslipId} disabled readOnly />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-text-secondary">PO No</label>
                <Input value={gatePass.poId} disabled readOnly />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-text-secondary">
                  Destination
                </label>
                <Input
                  value={gatePass.destination}
                  disabled={!canEdit}
                  onChange={(event) => onUpdateField('destination', event.target.value)}
                />
              </div>
            </div>
          </section>

          <section className="mb-6">
            <h3 className="mb-3 text-sm font-semibold text-text-primary">Items</h3>
            <div className="overflow-x-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>No.</TableHead>
                    <TableHead>Item Description</TableHead>
                    <TableHead>Brand</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Unit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {gatePass.items.map((item, index) => {
                    const catalog = catalogBrandAndModel(catalogItems, item.itemCode)
                    const brand = item.brand.trim() || catalog.brand || '—'
                    const model = catalog.model || '—'
                    return (
                    <TableRow key={item.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        <div>{item.description}</div>
                        <div className="text-xs text-text-secondary">{item.itemCode}</div>
                      </TableCell>
                      <TableCell>{brand}</TableCell>
                      <TableCell>{model}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{item.unit}</TableCell>
                    </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </section>

          <section>
            <label className="mb-1 block text-xs font-medium text-text-secondary">Remarks</label>
            <textarea
              value={gatePass.remarks}
              disabled={!canEdit}
              onChange={(event) => onUpdateField('remarks', event.target.value)}
              className="min-h-24 w-full rounded-md border border-border-input bg-surface px-3 py-2 text-sm disabled:opacity-60"
            />
          </section>

          {message ? <p className="mt-4 text-sm text-text-secondary">{message}</p> : null}
        </div>

        {gatePass.status === 'approved' ? (
          <div className="flex shrink-0 flex-wrap items-center gap-3 border-t border-border px-5 py-4 sm:px-6">
            {existingDeliveryReceiptId ? (
              <div className="text-right text-sm">
                <p className="font-medium text-text-primary">Delivery Receipt Already Created</p>
                <button
                  type="button"
                  className="font-medium text-maroon hover:underline"
                  onClick={() => onViewDeliveryReceipt(existingDeliveryReceiptId)}
                >
                  {existingDeliveryReceiptId}
                </button>
              </div>
            ) : (
              <Button type="button" onClick={onCreateDeliveryReceipt}>
                Create Delivery Receipt
              </Button>
            )}
          </div>
        ) : null}
      </div>
    </div>
  )
}
