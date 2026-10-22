import { Button } from '@/components/ui/button'
import type { Receiving } from '@/data/erpTypes'
import { useSetupCustomers } from '@/hooks/useSetupCustomers'
import { X } from 'lucide-react'
import { useEffect, useId, useMemo } from 'react'

interface CreateOutslipFromReceivingDialogProps {
  open: boolean
  receivings: Receiving[]
  selectedReceivingId: string
  selectedCustomerId: string
  message: string | null
  onSelectedReceivingIdChange: (receivingId: string) => void
  onSelectedCustomerIdChange: (customerId: string) => void
  onConfirm: () => void
  onClose: () => void
}

export function CreateOutslipFromReceivingDialog({
  open,
  receivings,
  selectedReceivingId,
  selectedCustomerId,
  message,
  onSelectedReceivingIdChange,
  onSelectedCustomerIdChange,
  onConfirm,
  onClose,
}: CreateOutslipFromReceivingDialogProps) {
  const titleId = useId()
  const customers = useSetupCustomers()

  const completedReceivings = useMemo(
    () => receivings.filter((row) => row.status === 'completed'),
    [receivings],
  )

  const selectedReceiving = useMemo(
    () => completedReceivings.find((row) => row.id === selectedReceivingId) ?? null,
    [completedReceivings, selectedReceivingId],
  )

  const itemsSummary = useMemo(() => {
    if (!selectedReceiving) return ''
    return selectedReceiving.items
      .map((item) => item.description)
      .filter(Boolean)
      .join(', ')
  }, [selectedReceiving])

  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown, true)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown, true)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-transparent p-3 sm:p-4"
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
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 id={titleId} className="text-lg font-semibold text-text-primary">
            New Outslip
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close new outslip"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-text-secondary hover:bg-maroon-light hover:text-maroon"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          <div>
            <label
              htmlFor="new-outslip-customer"
              className="mb-1 block text-sm text-text-primary"
            >
              Customer
            </label>
            <select
              id="new-outslip-customer"
              value={selectedCustomerId}
              onChange={(event) => onSelectedCustomerIdChange(event.target.value)}
              className="h-10 w-full rounded-md border border-border-input bg-surface px-3 text-sm"
            >
              <option value="">Select customer...</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="new-outslip-receiving"
              className="mb-1 block text-sm text-text-primary"
            >
              From Receiving (completed)
            </label>
            <select
              id="new-outslip-receiving"
              value={selectedReceivingId}
              onChange={(event) => onSelectedReceivingIdChange(event.target.value)}
              className="h-10 w-full rounded-md border border-border-input bg-surface px-3 text-sm"
            >
              <option value="">Select receiving...</option>
              {completedReceivings.map((receiving) => (
                <option key={receiving.id} value={receiving.id}>
                  {receiving.id} — {receiving.supplier || '—'}
                </option>
              ))}
            </select>
          </div>

          {itemsSummary ? (
            <p className="text-sm text-text-secondary">Items: {itemsSummary}</p>
          ) : null}

          {message ? <p className="text-sm text-error-text">{message}</p> : null}
        </div>

        <div className="flex justify-start border-t border-border px-5 py-4">
          <Button type="button" onClick={onConfirm}>
            Create Outslip
          </Button>
        </div>
      </div>
    </div>
  )
}
