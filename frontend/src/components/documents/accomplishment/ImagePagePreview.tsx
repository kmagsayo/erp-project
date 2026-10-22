import { Pagination } from '@/components/ui/pagination'
import type { ReportImage } from '@/lib/accomplishmentReportImages'
import {
  calculateTotalPages,
  getImagesForPage,
  IMAGES_PER_PAGE,
  padImageSlots,
} from '@/lib/reportPages'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useEffect, useState } from 'react'

interface ImagePagePreviewProps {
  images: ReportImage[]
  onRemoveImage: (id: string) => void
}

export function ImagePagePreview({ images, onRemoveImage }: ImagePagePreviewProps) {
  const totalPages = calculateTotalPages(images.length)
  const [currentPage, setCurrentPage] = useState(1)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const hasLightbox = lightboxIndex !== null && images[lightboxIndex]

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages))
  }, [totalPages])

  useEffect(() => {
    if (lightboxIndex === null) return
    if (images.length === 0) {
      setLightboxIndex(null)
      return
    }
    if (lightboxIndex > images.length - 1) {
      setLightboxIndex(images.length - 1)
    }
  }, [images, lightboxIndex])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (!hasLightbox) return
      if (event.key === 'Escape') {
        setLightboxIndex(null)
      } else if (event.key === 'ArrowLeft') {
        setLightboxIndex((current) =>
          current === null ? current : Math.max(0, current - 1),
        )
      } else if (event.key === 'ArrowRight') {
        setLightboxIndex((current) =>
          current === null ? current : Math.min(images.length - 1, current + 1),
        )
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [hasLightbox, images.length])

  const pageImages = getImagesForPage(images, currentPage)
  const slots = padImageSlots(pageImages)
  const firstImageIndex = (currentPage - 1) * IMAGES_PER_PAGE
  const lightboxImage = lightboxIndex !== null ? images[lightboxIndex] : null

  return (
    <div className="report-upload-preview">
      <section
        className="report-upload-preview-page"
        aria-label={`Picture preview page ${currentPage} of ${totalPages}`}
      >
        <div className="report-upload-preview-header">
          <span className="font-semibold text-text-primary">
            Page {currentPage} of {totalPages}
          </span>
        </div>

        <div className="report-upload-preview-grid">
          {slots.map((image, slotIndex) => (
            <div
              key={image?.id ?? `empty-${currentPage}-${slotIndex}`}
              className={
                image
                  ? 'report-upload-preview-cell'
                  : 'report-upload-preview-cell report-upload-preview-cell--empty'
              }
            >
              {image ? (
                <>
                  <button
                    type="button"
                    className="report-upload-preview-image-wrap"
                    onClick={() => setLightboxIndex(firstImageIndex + slotIndex)}
                    aria-label="Open picture preview"
                  >
                    <img src={image.src} alt="" draggable={false} />
                  </button>
                  <button
                    type="button"
                    className="report-upload-preview-remove"
                    aria-label="Remove picture"
                    onClick={(event) => {
                      event.stopPropagation()
                      onRemoveImage(image.id)
                    }}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </>
              ) : (
                <span className="text-xs text-text-secondary">Empty</span>
              )}
            </div>
          ))}
        </div>
      </section>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      {hasLightbox && lightboxImage ? (
        <div
          className="report-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Image preview"
          onClick={() => setLightboxIndex(null)}
        >
          <div
            className="report-lightbox-content"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="report-lightbox-close"
              onClick={() => setLightboxIndex(null)}
              aria-label="Close image preview"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="report-lightbox-image-wrap">
              <img src={lightboxImage.src} alt="" />
            </div>

            <div className="report-lightbox-nav">
              <button
                type="button"
                className="report-lightbox-nav-btn"
                disabled={lightboxIndex === 0}
                onClick={() =>
                  setLightboxIndex((current) =>
                    current === null ? current : Math.max(0, current - 1),
                  )
                }
                aria-label="Show previous image"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>
              <span className="report-lightbox-count">
                {lightboxIndex + 1} of {images.length}
              </span>
              <button
                type="button"
                className="report-lightbox-nav-btn"
                disabled={lightboxIndex === images.length - 1}
                onClick={() =>
                  setLightboxIndex((current) =>
                    current === null
                      ? current
                      : Math.min(images.length - 1, current + 1),
                  )
                }
                aria-label="Show next image"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
