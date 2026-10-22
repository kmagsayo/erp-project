import logo from '@/assets/logo.png'
import { companyInfo } from '@/data/accomplishmentReports'

interface ReportHeaderProps {
  pageNumber: number
  totalPages: number
}

export function ReportHeader({ pageNumber, totalPages }: ReportHeaderProps) {
  return (
    <header className="report-letterhead">
      <div className="report-head">
        <img src={logo} alt={`${companyInfo.name} logo`} className="report-logo" />
        <div className="report-company">
          <div className="report-company-name">{companyInfo.name}</div>
          {companyInfo.addressLines.map((line) => (
            <div key={line} className="report-company-meta">
              {line}
            </div>
          ))}
          <div className="report-company-meta">TEL NO.: {companyInfo.phone}</div>
          <div className="report-company-meta">VAT REG. TIN.: {companyInfo.vatTin}</div>
        </div>
      </div>
      <h1 className="report-title">ACCOMPLISHMENT REPORT</h1>
      {totalPages > 1 ? (
        <div className="report-page-label">
          Page {pageNumber} of {totalPages}
        </div>
      ) : null}
    </header>
  )
}
