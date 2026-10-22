import type { AccomplishmentReportViewModel } from '@/lib/accomplishmentReport'
import { groupImagesIntoPages } from '@/lib/reportPages'
import { ReportHeader } from './ReportHeader'
import { ReportInformation } from './ReportInformation'
import { ReportPictures } from './ReportPictures'
import { ReportSignature } from './ReportSignature'

interface AccomplishmentReportProps {
  report: AccomplishmentReportViewModel
}

export function AccomplishmentReport({ report }: AccomplishmentReportProps) {
  const pages = groupImagesIntoPages(report.images)
  const totalPages = pages.length

  return (
    <div className="report-document">
      {pages.map((pageImages, pageIndex) => {
        const pageNumber = pageIndex + 1
        const isFirstPage = pageIndex === 0
        const isLastPage = pageNumber === totalPages

        return (
          <section
            key={`${report.id}-page-${pageNumber}`}
            className="report-page"
            aria-label={`Accomplishment Report page ${pageNumber} of ${totalPages}`}
          >
            <ReportHeader pageNumber={pageNumber} totalPages={totalPages} />
            <div className="report-sheet">
              {isFirstPage ? <ReportInformation report={report} /> : null}
              <ReportPictures images={pageImages} attached={isFirstPage} />
              {isLastPage ? <ReportSignature report={report} /> : null}
            </div>
          </section>
        )
      })}
    </div>
  )
}
