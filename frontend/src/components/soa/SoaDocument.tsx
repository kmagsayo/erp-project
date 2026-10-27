import logo from '@/assets/logo.png'
import { companyInfo } from '@/data/accomplishmentReports'
import type { SoaPrintDocumentModel } from '@/lib/soa'
import { formatSoaPrintDate, formatSoaPrintMoney } from '@/lib/soa'

const EMPTY_ROWS = 8

export function SoaDocument({ document }: { document: SoaPrintDocumentModel }) {
  const emptyRows = Math.max(0, EMPTY_ROWS - document.items.length)

  return (
    <div className="soa-document">
      <div className="soa-head">
        <img src={logo} alt={`${companyInfo.name} logo`} className="soa-logo" />
        <div className="soa-company">
          <div className="soa-company-name">{companyInfo.name}</div>
          {companyInfo.addressLines.map((line) => (
            <div key={line}>{line}</div>
          ))}
          <div>Tel no: {companyInfo.phone}</div>
          <div>VAT REG. TIN.: {companyInfo.vatTin}</div>
        </div>
      </div>

      <h1 className="soa-title">STATEMENT OF ACCOUNT</h1>

      <div className="soa-meta">
        <div className="soa-bill-to">
          <div className="soa-bill-label">Bill To:</div>
          <div className="soa-customer-name">{document.customerName}</div>
          {document.customerAddress ? (
            <div className="soa-customer-address">{document.customerAddress}</div>
          ) : null}
        </div>
        <div className="soa-right-meta">
          <div className="soa-meta-line">
            <span>Statement Date:</span>
            <span className="soa-meta-value">{formatSoaPrintDate(document.statementDate)}</span>
          </div>
          <div className="soa-meta-line">
            <span>Statement No.:</span>
            <span className="soa-meta-value">{document.statementNo}</span>
          </div>
        </div>
      </div>

      <div className="soa-reference">
        <span className="soa-reference-label">Reference</span>
        <span className="soa-reference-value">{document.reference}</span>
      </div>

      <div className="soa-activity-caption">{document.activityCaption}</div>

      <table className="soa-items-table">
        <colgroup>
          <col className="soa-col-item" />
          <col className="soa-col-qty" />
          <col className="soa-col-unit" />
          <col className="soa-col-desc" />
          <col className="soa-col-price" />
          <col className="soa-col-total" />
        </colgroup>
        <thead>
          <tr>
            <th>ITEM</th>
            <th>QTY</th>
            <th>UNIT</th>
            <th>ITEM DESCRIPTION</th>
            <th>UNIT PRICE</th>
            <th>TOTAL</th>
          </tr>
        </thead>
        <tbody>
          {document.items.map((item) => (
            <tr key={item.id}>
              <td className="soa-c">{item.itemNo}</td>
              <td className="soa-c">{item.quantity}</td>
              <td className="soa-c">{item.unit.toUpperCase()}</td>
              <td className="soa-l">{item.description}</td>
              <td className="soa-r">{formatSoaPrintMoney(item.unitPrice)}</td>
              <td className="soa-r">{formatSoaPrintMoney(item.total)}</td>
            </tr>
          ))}
          {Array.from({ length: emptyRows }).map((_, index) => (
            <tr key={`empty-${index}`} className="soa-empty">
              <td>&nbsp;</td>
              <td>&nbsp;</td>
              <td>&nbsp;</td>
              <td>&nbsp;</td>
              <td>&nbsp;</td>
              <td>&nbsp;</td>
            </tr>
          ))}
          <tr>
            <td colSpan={6} className="soa-nothing">
              ****NOTHING FOLLOWS****
            </td>
          </tr>
          <tr className="soa-subtotal-row">
            <td colSpan={4} className="soa-total-label">
              SUB-TOTAL AMOUNT
            </td>
            <td className="soa-c">PHP</td>
            <td className="soa-r">{formatSoaPrintMoney(document.subtotalAmount)}</td>
          </tr>
          <tr className="soa-grand-row">
            <td colSpan={4} className="soa-total-label">
              GRAND TOTAL AMOUNT
            </td>
            <td className="soa-c">PHP</td>
            <td className="soa-r soa-total-value">{formatSoaPrintMoney(document.totalAmount)}</td>
          </tr>
        </tbody>
      </table>

      <div className="soa-signatures">
        <div className="soa-signature">
          <div className="soa-signature-label">Prepared by:</div>
          <div className="soa-signature-space" />
          <div className="soa-signature-name">Larke Gelbolingo</div>
          <div className="soa-signature-role">Project Manager</div>
        </div>
        <div className="soa-signature">
          <div className="soa-signature-label">Received by:</div>
          <div className="soa-signature-line" />
          <div className="soa-signature-role">Signature Over Printed Name</div>
        </div>
      </div>

      <p className="soa-thanks">Thank You For Your Business!</p>
    </div>
  )
}
