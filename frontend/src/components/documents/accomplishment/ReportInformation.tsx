import type { AccomplishmentReportViewModel } from '@/lib/accomplishmentReport'

export function ReportInformation({ report }: { report: AccomplishmentReportViewModel }) {
  return (
    <table className="report-info-table">
      <colgroup>
        <col />
        <col />
      </colgroup>
      <tbody>
        <tr>
          <td colSpan={2} className="report-info-full">
            <span className="report-info-inline-label">Project Name:</span>{' '}
            {report.projectName}
          </td>
        </tr>
        <tr>
          <td className="report-info-half">
            <span className="report-info-inline-label">Location:</span>{' '}
            {report.location}
          </td>
          <td className="report-info-half">
            <span className="report-info-inline-label">Remarks:</span>{' '}
            {report.remarks}
          </td>
        </tr>
        <tr>
          <td className="report-info-full">
            <span className="report-info-inline-label">Installation Report No.:</span>{' '}
            {report.installationReportNo}
          </td>
          <td className="report-info-full">
            <span className="report-info-inline-label">Date:</span> {report.date}
          </td>
        </tr>
      </tbody>
    </table>
  )
}
