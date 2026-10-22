import logo from '@/assets/logo.png'
import { TransactionBarcode } from '@/components/ui/transaction-barcode'
import { companyInfo } from '@/data/accomplishmentReports'
import type { Receiving } from '@/data/erpTypes'
import { formatPrintMoney } from '@/lib/quotations'
import { receivingListStatusLabel } from '@/lib/receivings'

const EMPTY_ROWS = 12

function formatLongDate(isoDate: string): string {
  if (!isoDate) return ''
  const date = new Date(`${isoDate}T00:00:00`)
  if (Number.isNaN(date.getTime())) return isoDate
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export function ReceivingDocument({ receiving }: { receiving: Receiving }) {
  const emptyRows = Math.max(0, EMPTY_ROWS - receiving.items.length)
  const total = receiving.items.reduce(
    (sum, item) => sum + item.receivedQuantity * item.unitPrice,
    0,
  )

  return (
    <div className="quotation-page">
      <div className="quotation-sheet">
        <div className="q-header">
          <img src={logo} alt="" className="q-logo" />
          <div className="q-company">
            <div className="q-company-name">{companyInfo.name}</div>
            {companyInfo.addressLines.map((line) => (
              <div key={line}>{line}</div>
            ))}
            <div>Tel no: {companyInfo.phone}</div>
            <div>VAT REG. TIN.: {companyInfo.vatTin}</div>
          </div>
        </div>

        <div className="q-title-bar">RECEIVING</div>

        <div className="q-meta">
          <div className="q-meta-left">
            <div className="q-line">
              <span className="q-label">Supplier:</span>
              <span className="q-value">{receiving.supplier}</span>
            </div>
            <div className="q-line">
              <span className="q-label">Warehouse:</span>
              <span className="q-value">{receiving.warehouse}</span>
            </div>
            <div className="q-line">
              <span className="q-label">PO No.:</span>
              <span className="q-value">{receiving.poId}</span>
            </div>
            <div className="q-line">
              <span className="q-label">Status:</span>
              <span className="q-value">{receivingListStatusLabel[receiving.status]}</span>
            </div>
          </div>
          <div className="q-meta-right">
            <div className="q-line">
              <span className="q-label">No.:</span>
              <span className="q-value">{receiving.id}</span>
            </div>
            <div className="q-line">
              <span className="q-label">Date:</span>
              <span className="q-value">{formatLongDate(receiving.date)}</span>
            </div>
            <TransactionBarcode value={receiving.id} />
          </div>
        </div>

        <table className="q-table">
          <colgroup>
            <col style={{ width: '16%' }} />
            <col style={{ width: '36%' }} />
            <col style={{ width: '8%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '15%' }} />
            <col style={{ width: '15%' }} />
          </colgroup>
          <thead>
            <tr>
              <th>Item Number</th>
              <th>Item Description</th>
              <th>QTY.</th>
              <th>Unit</th>
              <th>Unit Cost</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {receiving.items.map((item) => (
              <tr key={item.id}>
                <td className="q-c">{item.itemCode}</td>
                <td className="q-l">{item.description}</td>
                <td className="q-c">{item.receivedQuantity}</td>
                <td className="q-c">{item.unit.toUpperCase()}</td>
                <td className="q-r">{formatPrintMoney(item.unitPrice)}</td>
                <td className="q-r">{formatPrintMoney(item.receivedQuantity * item.unitPrice)}</td>
              </tr>
            ))}
            {Array.from({ length: emptyRows }).map((_, index) => (
              <tr key={`empty-${index}`} className="q-empty">
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
              </tr>
            ))}
            <tr>
              <td colSpan={6} className="q-nothing">
                ****NOTHING FOLLOWS****
              </td>
            </tr>
          </tbody>
        </table>

        <div className="q-total">
          <span className="q-total-label">TOTAL</span>
          <span className="q-total-amount">{formatPrintMoney(total)}</span>
        </div>

        <div className="q-signs">
          <div className="q-yours">
            <div>Prepared by:</div>
            <div className="q-yours-space" />
            <div className="q-yours-name">{receiving.preparedBy.toUpperCase()}</div>
            <div className="q-yours-date">
              Date: <span className="q-date-line" />
            </div>
          </div>
          <div className="q-conforme">
            <div className="q-conforme-title">RECEIVED BY:</div>
            <div className="q-conforme-name">{receiving.confirmedBy.toUpperCase()}</div>
            <div className="q-conforme-caption">Signature Over Printed Name</div>
            <div className="q-yours-date">
              Date: <span className="q-date-line" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
