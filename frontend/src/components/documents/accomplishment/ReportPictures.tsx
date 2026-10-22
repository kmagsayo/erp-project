import type { AccomplishmentReportImage } from '@/data/accomplishmentReports'
import { padImageSlots } from '@/lib/reportPages'
import { ReportImageGrid } from './ReportImageGrid'

export function ReportPictures({
  images,
  attached,
}: {
  images: AccomplishmentReportImage[]
  attached: boolean
}) {
  const slots = padImageSlots(images)

  return (
    <div
      className={
        attached ? 'report-pictures' : 'report-pictures report-pictures-standalone'
      }
    >
      <div className="report-pictures-label">Pictures</div>
      <ReportImageGrid slots={slots} />
    </div>
  )
}
