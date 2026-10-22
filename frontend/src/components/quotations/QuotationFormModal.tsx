import { QuotationForm } from '@/components/quotations/QuotationForm'
import type { Quotation } from '@/data/quotationTypes'
import { X } from 'lucide-react'
import { useEffect, useId } from 'react'

interface QuotationFormModalProps {
  open: boolean
  title: string
  quotation: Quotation
  onChange: (quotation: Quotation) => void
  onSave: () => void
  onClose: () => void
}

export function QuotationFormModal({
  open,
  title,
  quotation,
  onChange,
  onSave,
  onClose,
}: QuotationFormModalProps) {
  const titleId = useId()

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
        className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-lg"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-border px-5 py-4">
          <h2 id={titleId} className="text-lg font-semibold text-text-primary">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-text-secondary hover:bg-table-header hover:text-text-primary"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <QuotationForm
            quotation={quotation}
            onChange={onChange}
            onSave={onSave}
            onCancel={onClose}
            hideCardChrome
            formTitle={title}
          />
        </div>
      </div>
    </div>
  )
}
