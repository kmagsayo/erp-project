import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { Outslip, OutslipItem } from '@/data/erpTypes'
import { catalogBrandAndModel, useCatalogItems } from '@/hooks/useCatalogItems'
import { formatMoney } from '@/lib/outslips'
import { formatReceivingReference } from '@/lib/receivings'
import { X } from 'lucide-react'
import { useEffect, useId, useRef } from 'react'

interface OutslipDetailModalProps {
  outslip: Outslip
  isEditing: boolean
  message: string | null
  existingDeliveryReceiptId: string | null
  existingGatePassId: string | null
  getAvailableForItem: (outslip: Outslip, item: OutslipItem) => number
  onClose: () => void
  onCancelEdit: () => void
  onSaveDraft: () => void
  onSubmitForApproval: () => void
  onApprove: () => void
  onRelease: () => void
  onCancelOutslip: () => void
  onCreateDeliveryReceipt: () => void
  onViewDeliveryReceipt: (receiptId: string) => void
  onCreateGatePass: () => void
  onViewGatePass: (gatePassId: string) => void
  onUpdateField: <K extends keyof Outslip>(key: K, value: Outslip[K]) => void
  onUpdateItem: (index: number, patch: Partial<OutslipItem>) => void
}

export function OutslipDetailModal({
  outslip,
  isEditing,
  message,
  existingDeliveryReceiptId,
  existingGatePassId,
  getAvailableForItem,
  onClose,
  onCancelEdit,
  onSaveDraft,
  onSubmitForApproval,
  onApprove,
  onRelease,
  onCancelOutslip,
  onCreateDeliveryReceipt,
  onViewDeliveryReceipt,
  onCreateGatePass,
  onViewGatePass,
  onUpdateField,
  onUpdateItem,
}: OutslipDetailModalProps) {
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

  const showCreateGatePass =
    !isEditing && Boolean(outslip.id) && outslip.status === 'released'
  const showCreateDeliveryReceipt = showCreateGatePass && Boolean(existingGatePassId)

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
              Outslip Details
            </p>
            <h2 className="mt-1 truncate text-xl font-semibold text-text-primary">
              {outslip.id
                ? `${outslip.id}${outslip.customer ? ` — ${outslip.customer}` : ''}`
                : '(New Outslip)'}
            </h2>
            {outslip.receivingId ? (
              <p className="mt-1 text-sm text-text-secondary">
                Reference: {formatReceivingReference(outslip.receivingId)}
              </p>
            ) : null}
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close outslip details"
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
                  Outslip Number
                </label>
                <Input value={outslip.id || '(New)'} disabled readOnly />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-text-secondary">Date</label>
                <Input
                  type="date"
                  value={outslip.date}
                  disabled={!isEditing}
                  onChange={(event) => onUpdateField('date', event.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-text-secondary">
                  Location
                </label>
                <Input
                  value={outslip.location}
                  disabled={!isEditing}
                  onChange={(event) => onUpdateField('location', event.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-text-secondary">
                  Prepared By
                </label>
                <Input
                  value={outslip.preparedBy}
                  disabled={!isEditing}
                  onChange={(event) => onUpdateField('preparedBy', event.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-text-secondary">
                  Received By
                </label>
                <Input
                  value={outslip.receivedBy}
                  disabled={!isEditing}
                  onChange={(event) => onUpdateField('receivedBy', event.target.value)}
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
                    <TableHead>PO Qty</TableHead>
                    <TableHead>Released Qty</TableHead>
                    <TableHead>Remaining Qty</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {outslip.items.map((item, index) => {
                    const catalog = catalogBrandAndModel(catalogItems, item.itemCode)
                    const brand = item.brand.trim() || catalog.brand || '—'
                    return (
                    <TableRow key={item.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        <div>{item.description}</div>
                        <div className="text-xs text-text-secondary">{item.itemCode}</div>
                      </TableCell>
                      <TableCell>{brand}</TableCell>
                      <TableCell>{item.poQuantity}</TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            type="number"
                            min={0}
                            max={getAvailableForItem(outslip, item)}
                            value={item.releasedQuantity}
                            onChange={(event) =>
                              onUpdateItem(index, {
                                releasedQuantity: Number(event.target.value) || 0,
                              })
                            }
                          />
                        ) : (
                          item.releasedQuantity
                        )}
                      </TableCell>
                      <TableCell>{item.remainingQuantity}</TableCell>
                      <TableCell>{item.unit}</TableCell>
                      <TableCell>{formatMoney(item.unitPrice)}</TableCell>
                      <TableCell>{formatMoney(item.total)}</TableCell>
                    </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </section>

          <section>
            <h3 className="mb-3 text-sm font-semibold text-text-primary">Totals & Remarks</h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="md:col-span-2">
                <label className="mb-1 block text-xs font-medium text-text-secondary">
                  Remarks
                </label>
                <textarea
                  value={outslip.remarks}
                  disabled={!isEditing}
                  onChange={(event) => onUpdateField('remarks', event.target.value)}
                  className="min-h-24 w-full rounded-md border border-border-input bg-surface px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-text-secondary">
                  Other Charges
                </label>
                <Input
                  type="number"
                  min={0}
                  value={outslip.otherCharges}
                  disabled={!isEditing}
                  onChange={(event) =>
                    onUpdateField('otherCharges', Number(event.target.value) || 0)
                  }
                />
                <div className="mt-3 space-y-1 text-sm">
                  <p>
                    <span className="text-text-secondary">Subtotal:</span>{' '}
                    {formatMoney(outslip.subtotal)}
                  </p>
                  <p className="font-medium text-text-primary">
                    <span className="text-text-secondary">Total Amount:</span>{' '}
                    {formatMoney(outslip.totalAmount)}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {message ? <p className="mt-4 text-sm text-text-secondary">{message}</p> : null}
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-3 border-t border-border px-5 py-4 sm:px-6">
          <div className="flex min-w-0 flex-1 flex-wrap gap-3">
            {isEditing ? (
              <>
                <Button type="button" onClick={onSaveDraft}>
                  Save Draft
                </Button>
                <Button type="button" variant="secondary" onClick={onCancelEdit}>
                  Cancel Edit
                </Button>
              </>
            ) : (
              <>
                {outslip.status === 'draft' ? (
                  <Button type="button" onClick={onSubmitForApproval}>
                    Submit for Approval
                  </Button>
                ) : null}
                {outslip.status === 'pending' ? (
                  <Button type="button" onClick={onApprove}>
                    Approve
                  </Button>
                ) : null}
                {outslip.status === 'approved' ? (
                  <Button type="button" onClick={onRelease}>
                    For Dispatch
                  </Button>
                ) : null}
                {outslip.status !== 'released' && outslip.status !== 'cancelled' ? (
                  <Button type="button" variant="secondary" onClick={onCancelOutslip}>
                    Cancel Outslip
                  </Button>
                ) : null}
              </>
            )}
          </div>

          {showCreateDeliveryReceipt || showCreateGatePass ? (
            <div className="ml-auto flex shrink-0 flex-wrap items-center justify-end gap-3">
              {showCreateGatePass ? (
                existingGatePassId ? (
                  <div className="text-right text-sm">
                    <p className="font-medium text-text-primary">Gate Pass Already Created</p>
                    <button
                      type="button"
                      className="font-medium text-maroon hover:underline"
                      onClick={() => onViewGatePass(existingGatePassId)}
                    >
                      {existingGatePassId}
                    </button>
                  </div>
                ) : (
                  <Button type="button" onClick={onCreateGatePass}>
                    Create Gate Pass
                  </Button>
                )
              ) : null}
              {showCreateDeliveryReceipt ? (
                existingDeliveryReceiptId ? (
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
                )
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
