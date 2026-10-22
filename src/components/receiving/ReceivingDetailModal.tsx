import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { Receiving } from '@/data/erpTypes'
import { formatDisplayDate } from '@/lib/receivings'
import { X } from 'lucide-react'
import { useEffect, useId, useRef } from 'react'

interface ReceivingDetailModalProps {
  receiving: Receiving
  message?: string | null
  onClose: () => void
  onConfirm: () => void
  onCreateOutslip: () => void
}

export function ReceivingDetailModal({
  receiving,
  message,
  onClose,
  onConfirm,
  onCreateOutslip,
}: ReceivingDetailModalProps) {
  const titleId = useId()
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

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

      const trapRoot = panelRef.current

      const focusable = trapRoot.querySelectorAll<HTMLElement>(
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

  const isPending = receiving.status === 'pending'
  const isCompleted = receiving.status === 'completed'

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
        className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-lg"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
          <h2 id={titleId} className="text-lg font-semibold text-text-primary sm:text-xl">
            Receiving Details
          </h2>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close receiving details"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-maroon-light hover:text-maroon"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          <section className="mb-6 grid grid-cols-1 gap-x-10 gap-y-3 sm:grid-cols-2">
            <MetaField label="Receiving No" value={receiving.id} emphasize />
            <MetaField label="PO" value={receiving.poId || '—'} />
            <MetaField label="Supplier" value={receiving.supplier || '—'} />
            <MetaField label="Date" value={formatDisplayDate(receiving.date) || '—'} />
          </section>

          <section>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Item</TableHead>
                  <TableHead className="text-center">Ordered</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {receiving.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.description}</TableCell>
                    <TableCell className="text-center">{item.orderedQuantity}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </section>

          {message ? <p className="mt-4 text-sm text-text-secondary">{message}</p> : null}
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-3 border-t border-border px-5 py-4 sm:px-6">
          {isPending ? (
            <Button type="button" onClick={onConfirm}>
              Confirm Receiving
            </Button>
          ) : null}
          {isCompleted ? (
            <Button type="button" onClick={onCreateOutslip}>
              Create Outslip
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function MetaField({
  label,
  value,
  emphasize = false,
}: {
  label: string
  value: string
  emphasize?: boolean
}) {
  return (
    <p className="text-sm text-text-primary">
      <span className="text-text-secondary">{label}:</span>{' '}
      <span className={emphasize ? 'font-semibold' : 'font-medium'}>{value}</span>
    </p>
  )
}
