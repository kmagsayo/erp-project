import { Button } from '@/components/ui/button'
import type { Quotation } from '@/data/quotationTypes'
import type { SetupSupplierOption } from '@/hooks/useSetupSuppliers'
import { useSetupSuppliers } from '@/hooks/useSetupSuppliers'
import { X } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'

interface ConvertToPoDialogProps {
  open: boolean
  quotation: Quotation
  onClose: () => void
  onConfirm: (supplier: SetupSupplierOption) => void
}

export function ConvertToPoDialog({
  open,
  quotation,
  onClose,
  onConfirm,
}: ConvertToPoDialogProps) {
  const titleId = useId()
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const suppliers = useSetupSuppliers()
  const [supplierId, setSupplierId] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setSupplierId('')
    setError(null)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeButtonRef.current?.focus()

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

  function handleConfirm() {
    const supplier = suppliers.find((row) => row.id === supplierId)
    if (!supplier) {
      setError('Please select a supplier before creating the purchase order.')
      return
    }
    onConfirm(supplier)
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-3 sm:p-4"
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
        <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-4">
          <h2 id={titleId} className="text-lg font-semibold text-text-primary">
            Convert to Purchase Order
          </h2>
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
          <p className="text-sm text-text-secondary">
            Select the supplier for the purchase order created from {quotation.quotationNo}.
          </p>
          <div>
            <label
              htmlFor="convert-to-po-supplier"
              className="mb-1 block text-xs font-medium text-text-secondary"
            >
              Supplier
            </label>
            <select
              id="convert-to-po-supplier"
              value={supplierId}
              onChange={(event) => {
                setSupplierId(event.target.value)
                setError(null)
              }}
              className="h-10 w-full rounded-md border border-border-input bg-surface px-3 text-sm"
            >
              <option value="">Select supplier</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </select>
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </div>

        <div className="flex justify-end gap-2 border-t border-border px-5 py-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={handleConfirm}>
            Create PO
          </Button>
        </div>
      </div>
    </div>
  )
}
