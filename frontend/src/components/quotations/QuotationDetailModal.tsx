import { ConvertToPoDialog } from '@/components/quotations/ConvertToPoDialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { Quotation, QuotationStatus } from '@/data/quotationTypes'
import type { SetupSupplierOption } from '@/hooks/useSetupSuppliers'
import { formatCurrency } from '@/lib/quotations'
import { Check, X } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'

const statusBadge = {
  approved: 'approved',
  pending: 'pending',
  rejected: 'rejected',
  draft: 'draft',
} as const

const statusLabel = {
  approved: 'Approved',
  pending: 'Pending',
  rejected: 'Rejected',
  draft: 'Draft',
}

function formatLongDate(isoDate: string): string {
  if (!isoDate) return '—'
  const date = new Date(`${isoDate}T00:00:00`)
  if (Number.isNaN(date.getTime())) return isoDate
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

interface QuotationDetailModalProps {
  quotation: Quotation
  onClose: () => void
  onStatusChange: (quotation: Quotation, status: QuotationStatus) => void
  onConvertToPo: (quotation: Quotation, supplier: SetupSupplierOption) => void
}

export function QuotationDetailModal({
  quotation,
  onClose,
  onStatusChange,
  onConvertToPo,
}: QuotationDetailModalProps) {
  const titleId = useId()
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const [convertOpen, setConvertOpen] = useState(false)

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    if (!convertOpen) {
      closeButtonRef.current?.focus()
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        if (convertOpen) return
        event.preventDefault()
        onClose()
        return
      }

      if (convertOpen || event.key !== 'Tab' || !panelRef.current) return

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
  }, [onClose, convertOpen])

  const isApproved = quotation.status === 'approved'
  const isPendingWorkflow =
    quotation.status === 'pending' || quotation.status === 'draft'
  const isRejected = quotation.status === 'rejected'

  function handleApprove() {
    onStatusChange(quotation, 'approved')
  }

  function handleSetPending() {
    onStatusChange(quotation, 'pending')
  }

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4"
        role="presentation"
        onMouseDown={(event) => {
          if (convertOpen) return
          if (event.target === event.currentTarget) onClose()
        }}
      >
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-lg"
          onMouseDown={(event) => event.stopPropagation()}
        >
          <div className="flex shrink-0 items-center justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
            <div>
              <h2 id={titleId} className="text-lg font-semibold text-text-primary sm:text-xl">
                Quotation Details
              </h2>
            </div>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              aria-label="Close quotation details"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-maroon-light hover:text-maroon"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
            <section className="mb-6 grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
              <MetaField label="Quotation No" value={quotation.quotationNo} />
              <MetaField label="Date" value={formatLongDate(quotation.date)} />
              <MetaField label="Customer" value={quotation.customerName || '—'} />
              <div>
                <p className="text-xs font-medium text-text-secondary">Status</p>
                <div className="mt-1">
                  <Badge variant={statusBadge[quotation.status]}>
                    {statusLabel[quotation.status]}
                  </Badge>
                </div>
              </div>
              <MetaField label="Total" value={formatCurrency(quotation.total)} />
            </section>

            <section className="mb-6">
              <div className="overflow-x-auto rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Item</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Unit Price</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {quotation.items.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-text-secondary">
                          No items on this quotation.
                        </TableCell>
                      </TableRow>
                    ) : (
                      quotation.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div className="font-medium text-text-primary">{item.itemName}</div>
                            {item.itemCode ? (
                              <div className="text-xs text-text-secondary">{item.itemCode}</div>
                            ) : null}
                          </TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(item.unitPrice)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(item.amount)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </section>

          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-3 border-t border-border px-5 py-4 sm:px-6">
            {isApproved ? (
              <Button type="button" onClick={() => setConvertOpen(true)}>
                Convert to PO
              </Button>
            ) : null}

            {isPendingWorkflow ? (
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-text-secondary hover:border-success-text hover:bg-success-bg hover:text-success-text"
                aria-label="Approve"
                title="Approve"
                onClick={handleApprove}
              >
                <Check className="h-4 w-4" />
              </button>
            ) : null}

            {isRejected ? (
              <Button type="button" variant="secondary" onClick={handleSetPending}>
                Pending
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      <ConvertToPoDialog
        open={convertOpen}
        quotation={quotation}
        onClose={() => setConvertOpen(false)}
        onConfirm={(supplier) => {
          setConvertOpen(false)
          onConvertToPo(quotation, supplier)
        }}
      />
    </>
  )
}

function MetaField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-text-secondary">{label}</p>
      <p className="mt-1 text-sm font-semibold text-text-primary">{value}</p>
    </div>
  )
}
