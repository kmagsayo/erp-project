import type { AccomplishmentReportViewModel } from '@/lib/accomplishmentReport'

export function ReportSignature({ report }: { report: AccomplishmentReportViewModel }) {
  return (
    <table className="report-signatures" role="presentation">
      <colgroup>
        <col />
        <col />
      </colgroup>
      <tbody>
        <tr>
          <td className="report-signature-col">
            <div className="report-signature-heading">Prepared By:</div>
            <div className="report-signature-block">
              <div className="report-signature-line" />
              <div className="report-signature-name">{report.preparedBy}</div>
              <div className="report-signature-role">{report.preparedByPosition}</div>
            </div>
          </td>
          <td className="report-signature-col">
            <div className="report-signature-heading">Confirmed By:</div>
            <div className="report-signature-block">
              <div className="report-signature-line" />
              <div className="report-signature-name">{report.confirmedByLabel}</div>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  )
}
