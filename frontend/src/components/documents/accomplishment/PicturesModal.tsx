import { ImagePagePreview } from '@/components/documents/accomplishment/ImagePagePreview'
import { ImageUploader } from '@/components/documents/accomplishment/ImageUploader'
import { PrintButton } from '@/components/documents/accomplishment/PrintButton'
import type { ReportImage } from '@/lib/accomplishmentReportImages'
import { Images, X } from 'lucide-react'
import { useEffect, useId, useRef } from 'react'

interface PicturesModalProps {
  reportId?: string
  images: ReportImage[]
  isOptimizing: boolean
  uploadError?: string | null
  onClose: () => void
  onUpload: (files: File[]) => void
  onRemoveImage: (id: string) => void
  onPrint: () => void
}

export function PicturesModal({
  reportId,
  images,
  isOptimizing,
  uploadError = null,
  onClose,
  onUpload,
  onRemoveImage,
  onPrint,
}: PicturesModalProps) {
  const titleId = useId()
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeButtonRef.current?.focus()

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        if (document.querySelector('.report-lightbox')) return
        event.preventDefault()
        onClose()
        return
      }

      if (event.key !== 'Tab' || !panelRef.current) return

      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), label[tabindex], [tabindex]:not([tabindex="-1"])',
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4"
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
        className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-lg"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <p className="text-sm font-medium text-text-secondary">
              {reportId ? `Report ${reportId}` : 'Accomplishment Report'}
            </p>
            <h2
              id={titleId}
              className="mt-1 flex items-center gap-2 text-xl font-semibold text-text-primary"
            >
              <Images className="h-5 w-5 shrink-0 text-maroon" aria-hidden="true" />
              Pictures ({images.length})
            </h2>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <PrintButton onPrint={onPrint} disabled={images.length === 0} />
            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              aria-label="Close pictures"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-maroon-light hover:text-maroon"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <ImageUploader onSelect={onUpload} disabled={isOptimizing} />
            {images.length === 0 ? (
              <p className="text-sm text-text-secondary">
                No pictures yet. Upload to get started.
              </p>
            ) : null}
          </div>

          {uploadError ? (
            <p className="mb-4 text-sm text-error-text">{uploadError}</p>
          ) : null}

          {images.length > 0 ? (
            <ImagePagePreview images={images} onRemoveImage={onRemoveImage} />
          ) : (
            <div className="flex min-h-40 items-center justify-center rounded-lg border border-dashed border-border bg-maroon-light/40 px-4 py-8 text-center text-sm text-text-secondary">
              Uploaded pictures will appear here in a 2-column grid.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
