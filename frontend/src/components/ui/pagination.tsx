import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
}: PaginationProps) {
  const isFirstPage = currentPage <= 1
  const isLastPage = currentPage >= totalPages

  return (
    <nav
      className={cn('report-upload-pagination', className)}
      aria-label="Report page navigation"
    >
      <button
        type="button"
        className="report-upload-pagination-nav"
        disabled={isFirstPage}
        aria-label="Previous page"
        onClick={() => onPageChange(currentPage - 1)}
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        Previous
      </button>

      <div className="report-upload-pagination-pages">
        {Array.from({ length: totalPages }, (_, index) => {
          const page = index + 1
          const isActive = page === currentPage

          return (
            <button
              key={page}
              type="button"
              className={cn(
                'report-upload-pagination-page',
                isActive && 'report-upload-pagination-page--active',
              )}
              aria-label={`Go to page ${page}`}
              aria-current={isActive ? 'page' : undefined}
              onClick={() => onPageChange(page)}
            >
              {page}
            </button>
          )
        })}
      </div>

      <button
        type="button"
        className="report-upload-pagination-nav"
        disabled={isLastPage}
        aria-label="Next page"
        onClick={() => onPageChange(currentPage + 1)}
      >
        Next
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </button>
    </nav>
  )
}
