import { SoaDocument } from '@/components/soa/SoaDocument'
import { Button } from '@/components/ui/button'
import type { SoaPrintDocumentModel } from '@/lib/soa'
import { X } from 'lucide-react'
import { useEffect, useId, useRef } from 'react'

interface SoaPreviewModalProps {
  printDocument: SoaPrintDocumentModel
  onClose: () => void
  onPrint: () => void
}

export function SoaPreviewModal({ printDocument, onClose, onPrint }: SoaPreviewModalProps) {
  const titleId = useId()
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const previousOverflow = window.document.body.style.overflow
    window.document.body.style.overflow = 'hidden'
    closeButtonRef.current?.focus()

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-transparent p-3 sm:p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex max-h-[90vh] w-full max-w-[860px] flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-lg"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div>
            <h2 id={titleId} className="text-lg font-semibold text-text-primary">
              Statement of Account Preview
            </h2>
            <p className="mt-1 text-sm text-text-secondary">{printDocument.customerName}</p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            className="rounded-md p-1.5 text-text-secondary hover:bg-table-header"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="overflow-y-auto bg-[#f3f4f6] px-4 py-4">
          <div className="mx-auto overflow-x-auto rounded-md border border-border bg-white">
            <SoaDocument document={printDocument} />
          </div>
        </div>
        <div className="flex shrink-0 justify-end gap-2 border-t border-border px-5 py-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Button type="button" onClick={onPrint}>
            Print
          </Button>
        </div>
      </div>
    </div>
  )
}
