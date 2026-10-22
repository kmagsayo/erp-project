import type { AccomplishmentReportImage } from '@/data/accomplishmentReports'

function ImageCell({ image }: { image: AccomplishmentReportImage | null }) {
  return (
    <td
      className={
        image
          ? 'report-image-cell image-cell'
          : 'report-image-cell image-cell report-image-cell--empty'
      }
    >
      <div className="report-image-cell-inner">
        {image ? (
          <div className="report-image-frame">
            <img src={image.src} alt="" draggable={false} />
          </div>
        ) : (
          /* Keep empty cells non-collapsing so print engines keep grid borders */
          <span className="report-image-cell-spacer" aria-hidden="true">
            &nbsp;
          </span>
        )}
      </div>
    </td>
  )
}

export function ReportImageGrid({
  slots,
}: {
  slots: Array<AccomplishmentReportImage | null>
}) {
  const cells = [
    slots[0] ?? null,
    slots[1] ?? null,
    slots[2] ?? null,
    slots[3] ?? null,
  ] as const

  return (
    <div className="report-image-grid-wrap">
      <table className="report-image-grid image-grid" role="presentation">
        <tbody>
          <tr>
            <ImageCell image={cells[0]} />
            <ImageCell image={cells[1]} />
          </tr>
          <tr>
            <ImageCell image={cells[2]} />
            <ImageCell image={cells[3]} />
          </tr>
        </tbody>
      </table>
    </div>
  )
}
