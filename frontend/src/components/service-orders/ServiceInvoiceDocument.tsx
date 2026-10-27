import logo from '@/assets/logo.png'
import { companyInfo } from '@/data/accomplishmentReports'
import { formatSoaPrintDate, formatSoaPrintMoney } from '@/lib/soa'
import type { ServiceOrder } from '@/lib/serviceOrders'

const EMPTY_ROWS = 10

export function ServiceInvoiceDocument({ order }: { order: ServiceOrder }) {
  const emptyRows = Math.max(0, EMPTY_ROWS - 1)
  const saleLabel = order.saleType === 'cash' ? 'Cash Sales' : 'Charge Sales'

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
        </div>
      </div>

      <h1 className="soa-title">SERVICE ORDER</h1>

      <div className="soa-meta">
        <div className="soa-bill-to">
          <div className="soa-bill-label">Bill To:</div>
          <div className="soa-customer-name">{order.customerName}</div>
          {order.customerAddress ? (
            <div className="soa-customer-address">{order.customerAddress}</div>
          ) : null}
          <div className="soa-thru">Sale: {saleLabel}</div>
        </div>
        <div className="soa-right-meta">
          <div className="soa-meta-line">
            <span>Date:</span>
            <span className="soa-meta-value">{formatSoaPrintDate(order.date)}</span>
          </div>
          <div className="soa-meta-line">
            <span>Service Order No.:</span>
            <span className="soa-meta-value">{order.invoiceNo}</span>
          </div>
        </div>
      </div>

      <div className="soa-reference">
        <span className="soa-reference-label">Project</span>
        <span className="soa-reference-value">{order.projectName}</span>
      </div>

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
          <tr>
            <td className="soa-c">1</td>
            <td className="soa-c">{order.quantity}</td>
            <td className="soa-c">LOT</td>
            <td className="soa-l">{order.description}</td>
            <td className="soa-r">{formatSoaPrintMoney(order.unitPrice)}</td>
            <td className="soa-r">{formatSoaPrintMoney(order.amount)}</td>
          </tr>
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
          <tr className="soa-total-row">
            <td colSpan={4} className="soa-total-label">
              TOTAL AMOUNT
            </td>
            <td className="soa-c">PHP</td>
            <td className="soa-r soa-total-value">{formatSoaPrintMoney(order.amount)}</td>
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
