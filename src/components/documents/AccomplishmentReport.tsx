import logo from '@/assets/logo.png'
import {
  companyInfo,
  type AccomplishmentReportData,
  type AccomplishmentReportImage,
  type CompanyInfo,
} from '@/data/accomplishmentReports'
import { groupImagesIntoPages } from '@/lib/reportPages'

interface AccomplishmentReportProps {
  report: AccomplishmentReportData
  company?: CompanyInfo
}

export function AccomplishmentReport({
  report,
  company = companyInfo,
}: AccomplishmentReportProps) {
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
            {isFirstPage ? (
              <ReportLetterhead
                company={company}
                pageNumber={pageNumber}
                totalPages={totalPages}
              />
            ) : (
              <div className="report-continued">
                <h1 className="report-title">ACCOMPLISHMENT REPORT</h1>
                <div className="report-page-label">
                  Page {pageNumber} of {totalPages}
                </div>
              </div>
            )}

            {isFirstPage ? <ReportInfoTable report={report} /> : null}
            <PicturesSection images={pageImages} attached={isFirstPage} />

            {isLastPage ? <SignatureSection report={report} /> : null}
          </section>
        )
      })}
    </div>
  )
}

function ReportLetterhead({
  company,
  pageNumber,
  totalPages,
}: {
  company: CompanyInfo
  pageNumber: number
  totalPages: number
}) {
  return (
    <header className="report-letterhead">
      <div className="report-letterhead-row">
        <img
          src={logo}
          alt={`${company.name} logo`}
          className="report-logo"
          width={72}
          height={72}
        />
        <div className="report-company">
          <div className="report-company-name">{company.name}</div>
          {company.addressLines.map((line) => (
            <div key={line} className="report-company-meta">
              {line}
            </div>
          ))}
          <div className="report-company-meta">Tel: {company.phone}</div>
          <div className="report-company-meta">Email: {company.email}</div>
        </div>
      </div>

      <h1 className="report-title">ACCOMPLISHMENT REPORT</h1>
      <div className="report-page-label">
        Page {pageNumber} of {totalPages}
      </div>
    </header>
  )
}

function ReportInfoTable({ report }: { report: AccomplishmentReportData }) {
  return (
    <table className="report-info-table">
      <tbody>
        <tr>
          <th>Project Name</th>
          <td>{report.projectName}</td>
          <th>Date</th>
          <td>{report.date}</td>
        </tr>
        <tr>
          <th>Location</th>
          <td>{report.location}</td>
          <th>Remarks</th>
          <td rowSpan={2}>{report.remarks}</td>
        </tr>
        <tr>
          <th>Installation Report No.</th>
          <td>{report.installationReportNo}</td>
        </tr>
      </tbody>
    </table>
  )
}

function PicturesSection({
  images,
  attached,
}: {
  images: AccomplishmentReportImage[]
  attached: boolean
}) {
  const rowCount = images.length > 2 ? 2 : 1

  return (
    <div
      className={
        attached ? 'report-pictures' : 'report-pictures report-pictures-standalone'
      }
    >
      <div className="report-pictures-label">Pictures</div>
      <div
        className="report-image-grid image-grid"
        style={{ gridTemplateRows: `repeat(${rowCount}, 1fr)` }}
      >
        {images.map((image, index) => (
          <div
            key={image.id ?? `image-${index}`}
            className="report-image-cell image-cell"
          >
            <img src={image.src} alt={image.alt} draggable={false} />
          </div>
        ))}
      </div>
    </div>
  )
}

function SignatureSection({ report }: { report: AccomplishmentReportData }) {
  return (
    <div className="report-signatures">
      <div className="report-signature-col">
        <div className="report-signature-heading">Prepared By:</div>
        <div className="report-signature-line" />
        <div className="report-signature-name">{report.preparedBy}</div>
        <div className="report-signature-role">Name of Personnel</div>
      </div>
      <div className="report-signature-col">
        <div className="report-signature-heading">Confirmed By:</div>
        <div className="report-signature-line" />
        <div className="report-signature-name">Signature of Printed</div>
        <div className="report-signature-role">Name / Position</div>
      </div>
    </div>
  )
}
