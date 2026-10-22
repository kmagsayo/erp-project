import logo from '@/assets/logo.png'
import { TransactionBarcode } from '@/components/ui/transaction-barcode'
import { companyInfo } from '@/data/accomplishmentReports'
import type { PurchaseOrder } from '@/data/purchaseOrderTypes'
import {
  amountToWords,
  formatDisplayDate,
  formatPrintMoney,
} from '@/lib/purchaseOrders'

const EMPTY_ROWS = 10

interface PurchaseOrderDocumentProps {
  order: PurchaseOrder
}

export function PurchaseOrderDocument({ order }: PurchaseOrderDocumentProps) {
  const emptyRows = Math.max(0, EMPTY_ROWS - order.items.length)
  const total = order.amount || order.items.reduce((sum, item) => sum + item.amount, 0)

  return (
    <div className="po-page">
      <div className="po-sheet">
        <div className="po-header">
          <img src={logo} alt="" className="po-logo" />
          <div className="po-company">
            <div className="po-company-name">{companyInfo.name}</div>
            {companyInfo.addressLines.map((line) => (
              <div key={line}>{line}</div>
            ))}
            <div>Tel no: {companyInfo.phone}</div>
            <div>VAT REG. TIN.: {companyInfo.vatTin}</div>
          </div>
        </div>

        <div className="po-title-bar">PURCHASE ORDER</div>

        <div className="po-meta">
          <div className="po-meta-left">
            <div className="po-line">
              <span className="po-label">Supplier:</span>
              <span className="po-value">{order.supplier}</span>
            </div>
            <div className="po-line">
              <span className="po-label">Address:</span>
              <span className="po-value">{order.supplierAddress}</span>
            </div>
            <div className="po-line">
              <span className="po-label">Telephone No.:</span>
              <span className="po-value">{order.supplierPhone}</span>
            </div>
            <div className="po-line">
              <span className="po-label">TIN No.:</span>
              <span className="po-value">{order.supplierTin}</span>
            </div>
          </div>
          <div className="po-meta-right">
            <div className="po-line">
              <span className="po-label">P.O. No.:</span>
              <span className="po-value">{order.poNo}</span>
            </div>
            <div className="po-line">
              <span className="po-label">Date:</span>
              <span className="po-value">{formatDisplayDate(order.date)}</span>
            </div>
            <TransactionBarcode value={order.poNo} />
          </div>
        </div>

        <div className="po-intro">
          Gentlemen/Mesdames: Please deliver to this Office the following articles subject to
          the terms and conditions contained herein:
        </div>

        <div className="po-terms">
          <div className="po-term-col">
            <div className="po-term-line">
              <span className="po-term-label">Place of Delivery:</span>
              <span className="po-term-value">{order.destination}</span>
            </div>
            <div className="po-term-line">
              <span className="po-term-label">Warranty Period:</span>
              <span className="po-term-value">{order.warrantyPeriod}</span>
            </div>
            <div className="po-term-line">
              <span className="po-term-label">Delivery Term:</span>
              <span className="po-term-value">{order.deliveryTerm}</span>
            </div>
          </div>
          <div className="po-term-col">
            <div className="po-term-line">
              <span className="po-term-label">Date of Delivery:</span>
              <span className="po-term-value">{formatDisplayDate(order.deliveryDate)}</span>
            </div>
            <div className="po-term-line">
              <span className="po-term-label">Project:</span>
              <span className="po-term-value">{order.project}</span>
            </div>
            <div className="po-term-line">
              <span className="po-term-label">Payment Term:</span>
              <span className="po-term-value">{order.paymentTerm}</span>
            </div>
          </div>
        </div>

        <table className="po-table">
          <colgroup>
            <col style={{ width: '14%' }} />
            <col style={{ width: '36%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '12%' }} />
            <col style={{ width: '14%' }} />
            <col style={{ width: '14%' }} />
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
            {order.items.map((item, index) => (
              <tr key={item.id}>
                <td className="po-c">{item.itemCode || index + 1}</td>
                <td className="po-l">{item.itemName}</td>
                <td className="po-c">{item.quantity}</td>
                <td className="po-c">{item.unit.toUpperCase()}</td>
                <td className="po-r">{formatPrintMoney(item.unitPrice)}</td>
                <td className="po-r">{formatPrintMoney(item.amount)}</td>
              </tr>
            ))}
            {Array.from({ length: emptyRows }).map((_, index) => (
              <tr key={`empty-${index}`} className="po-empty">
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
              </tr>
            ))}
            <tr>
              <td colSpan={6} className="po-nothing">
                ****NOTHING FOLLOWS****
              </td>
            </tr>
          </tbody>
        </table>

        <div className="po-total">
          <span className="po-total-label">GRAND TOTAL</span>
          <span className="po-total-amount">{formatPrintMoney(total)}</span>
        </div>

        <div className="po-words">
          <span className="po-words-label">TOTAL AMOUNT IN WORDS:</span>
          <span>{amountToWords(total)}</span>
        </div>

        <div className="po-penalty">
          In case of failure to make full delivery within the time specified above, a penalty of
          one-tenth (1/10) of one percent for everyday of delay shall be imposed.
        </div>

        <div className="po-signs">
          <div className="po-yours">
            <div>Very truly yours,</div>
            <div className="po-yours-space" />
            <div className="po-yours-name">
              {(order.preparedBy || 'LARKE G. GELBOLINGO').toUpperCase()}
            </div>
            <div className="po-yours-title">
              {(order.preparedByPosition || 'CEO/PRESIDENT').toUpperCase()}
            </div>
            <div className="po-yours-date">
              Date: <span className="po-date-line" />
            </div>
          </div>
          <div className="po-conforme">
            <div className="po-conforme-title">CONFORME:</div>
            <div className="po-conforme-supplier">{(order.supplier || '').toUpperCase()}</div>
            <div className="po-conforme-caption">Signature Over Printed Name of Supplier</div>
            <div className="po-yours-date">
              Date: <span className="po-date-line" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
